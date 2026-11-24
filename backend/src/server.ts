import { createServer } from 'node:http';
import { createApp } from './app';
import { env } from './config';
import { db, redis } from './core/db';
import { log } from './core/http';
import { jobs, queueConnection } from './jobs';
import { socketServer } from './modules/chat/socket';
async function start() { await db.$connect(); await redis.ping(); const server = createServer(createApp()); const socket = await socketServer(server); server.listen(env.PORT, () => log.info({ port: env.PORT }, 'TRENDHIVE API listening')); let stopping = false; const shutdown = async () => { if (stopping)
    return; stopping = true; const timeout = setTimeout(() => process.exit(1), 20000); timeout.unref(); server.close(); await socket.close(); await jobs.close(); await Promise.all([db.$disconnect(), redis.quit(), queueConnection.quit()]); clearTimeout(timeout); process.exit(0); }; process.once('SIGTERM', () => void shutdown()); process.once('SIGINT', () => void shutdown()); }
start().catch(error => { log.fatal({ err: error }, 'API startup failed'); process.exit(1); });
