import { Server } from 'socket.io';
import type { Server as HTTPServer } from 'node:http';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';
import { db, redis } from '../../core/db';
import { verifyAccess } from '../../core/security';
import { env } from '../../config';
import { assert, log } from '../../core/http';
import { participant, message, markRead, setRealtime } from './service';
import { messageSchema } from './routes';
import { z } from 'zod';
export async function socketServer(http: HTTPServer) {
    const io = new Server(http, { cors: { origin: env.CORS_ORIGINS.split(',').map(x => x.trim()), credentials: true }, maxHttpBufferSize: 20000, allowRequest: (req, cb) => cb(null, typeof req.headers.origin === 'string' && env.CORS_ORIGINS.split(',').map(x => x.trim()).includes(req.headers.origin)) });
    const pub = new Redis(env.REDIS_URL, { maxRetriesPerRequest: null });
    const sub = pub.duplicate();
    io.adapter(createAdapter(pub, sub));
    setRealtime(io);
    const events = new Redis(env.REDIS_URL, { maxRetriesPerRequest: null });
    await events.subscribe('trendhive:realtime');
    events.on('message', (_channel, raw) => { try {
        const event = z.object({ room: z.string().regex(/^(user|conversation):[a-zA-Z0-9_-]+$/), event: z.enum(['notification', 'analytics.updated']), data: z.unknown() }).parse(JSON.parse(raw));
        io.to(event.room).emit(event.event, event.data);
    }
    catch (error) {
        log.warn({ err: error }, 'Invalid realtime event');
    } });
    io.use(async (socket, next) => { try {
        const cookie = socket.handshake.headers.cookie?.split(';').map(x => x.trim()).find(x => x.startsWith('th_access='))?.slice(10);
        const token = socket.handshake.auth.token ?? cookie;
        assert(typeof token === 'string', 401, 'UNAUTHENTICATED', 'Login required.');
        const decoded = verifyAccess(token);
        const [user, session] = await Promise.all([db.user.findFirst({ where: { id: decoded.sub, deletedAt: null, bannedAt: null } }), db.refreshToken.findUnique({ where: { id: decoded.sid } })]);
        assert(user && session && !session.revokedAt && session.userId === user.id && session.expiresAt > new Date(), 401, 'INVALID_SESSION', 'Session expired.');
        assert(!session.family.startsWith('impersonation:'),403,'READ_ONLY_SESSION','Impersonation cannot connect to interactive chat.');
        socket.data.user = user;
        socket.data.sessionId = session.id;
        socket.data.expiresAt = decoded.exp * 1000;
        next();
    }
    catch {
        next(new Error('Authentication failed.'));
    } });
    io.on('connection', socket => {
        const user = socket.data.user;
        void socket.join(`user:${user.id}`);
        const heartbeat = async () => {
            const session = await db.refreshToken.findUnique({ where: { id: socket.data.sessionId }, include: { user: true } });
            if (!session || session.revokedAt || session.expiresAt <= new Date() || session.user.bannedAt || session.user.deletedAt || socket.data.expiresAt <= Date.now()) {
                socket.disconnect(true);
                return;
            }
            await redis.zadd(`presence:${user.id}`, Date.now() + 60000, socket.id);
            await redis.expire(`presence:${user.id}`, 120);
        };
        const failedHeartbeat = (error: unknown) => { log.warn({ err: error }, 'Socket session check failed'); socket.disconnect(true); };
        const expiryTimer = setTimeout(() => socket.disconnect(true), Math.max(0, socket.data.expiresAt - Date.now()));
        expiryTimer.unref();
        void heartbeat().catch(failedHeartbeat);
        const timer = setInterval(() => { void heartbeat().catch(failedHeartbeat); }, 30000);
        timer.unref();
        socket.use(async (_packet, next) => { try {
            const session = await db.refreshToken.findUnique({ where: { id: socket.data.sessionId }, include: { user: true } });
            assert(session && !session.revokedAt && !session.user.bannedAt && !session.user.deletedAt && socket.data.expiresAt > Date.now(), 401, 'INVALID_SESSION', 'Session expired.');
            const count = Number(await redis.eval("local n=redis.call('INCR',KEYS[1]); if n==1 then redis.call('EXPIRE',KEYS[1],60) end; return n", 1, `socket-rate:${user.id}`));
            assert(count <= 180, 429, 'RATE_LIMITED', 'Too many socket events.');
            next();
        }
        catch {
            next(new Error('Session expired or rate limit reached.'));
            socket.disconnect(true);
        } });
        socket.on('join', async (raw, ack) => { try {
            const id = z.string().max(100).parse(raw);
            await participant(user.id, id);
            await socket.join(`conversation:${id}`);
            if (typeof ack === 'function')
                ack({ success: true });
        }
        catch {
            if (typeof ack === 'function')
                ack({ success: false, error: 'Conversation unavailable' });
        } });
        socket.on('typing', async (raw) => { try {
            const input = z.object({ conversationId: z.string().max(100), typing: z.boolean() }).strict().parse(raw);
            await participant(user.id, input.conversationId);
            socket.to(`conversation:${input.conversationId}`).emit('typing', { ...input, userId: user.id });
        }
        catch {
            socket.emit('event-error', { code: 'INVALID_EVENT' });
        } });
        socket.on('message', async (raw, ack) => { try {
            const { conversationId, ...body } = z.object({ conversationId: z.string().max(100), body: z.string().max(5000).default(''), attachmentIds: z.array(z.string().max(100)).max(5).default([]) }).strict().parse(raw);
            const result = await message(user, conversationId, messageSchema.parse(body));
            if (typeof ack === 'function')
                ack({ success: true, data: result });
        }
        catch {
            if (typeof ack === 'function')
                ack({ success: false, error: 'Message could not be sent.' });
        } });
        socket.on('read', async (raw, ack) => { try {
            const id = z.string().max(100).parse(raw);
            const data = await markRead(user.id, id);
            if (typeof ack === 'function')
                ack({ success: true, data });
        }
        catch {
            if (typeof ack === 'function')
                ack({ success: false, error: 'Conversation unavailable.' });
        } });
        socket.on('disconnect', () => { clearInterval(timer); clearTimeout(expiryTimer); void redis.zrem(`presence:${user.id}`, socket.id).catch(e => log.warn({ err: e }, 'Presence cleanup failed')); });
    });
    return { io, close: async () => { await new Promise<void>(resolve => io.close(() => resolve())); await Promise.all([pub.quit(), sub.quit(), events.quit()]); } };
}
