import type { User, Prisma } from '@prisma/client';
import type { Server } from 'socket.io';
import { db, redis, transaction, outbox } from '../../core/db';
import { assert } from '../../core/http';
export let realtime: Server | undefined;
export const setRealtime = (server: Server) => { realtime = server; };
export async function participant(userId: string, id: string) { const p = await db.conversationParticipant.findFirst({ where: { userId, conversationId: id, deletedAt: null, conversation: { deletedAt: null } } }); assert(p, 403, 'FORBIDDEN', 'You are not a participant in this conversation.'); return p; }
export async function message(user: User, conversationId: string, input: {
    body: string;
    attachmentIds: string[];
}) {
    await participant(user.id, conversationId);
    const assets = await db.mediaAsset.findMany({ where: { id: { in: input.attachmentIds }, uploadedBy: user.id, scanStatus: 'CLEAN', deletedAt: null } });
    assert(assets.length === input.attachmentIds.length, 400, 'INVALID_ATTACHMENTS', 'Attachments must be your approved uploads.');
    const result = await transaction(async (tx) => { const msg = await tx.message.create({ data: { conversationId, senderId: user.id, body: input.body, attachments: assets.map(a => ({ id: a.id, type: a.type })) as Prisma.InputJsonValue } }); await tx.conversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } }); const others = await tx.conversationParticipant.findMany({ where: { conversationId, userId: { not: user.id }, deletedAt: null } }); for (const p of others)
        await outbox(tx, 'notification', { userId: p.userId, type: 'message.new', title: 'New message', body: input.body.slice(0, 200), link: `/dashboard?conversation=${conversationId}` }); return msg; });
    realtime?.to(`conversation:${conversationId}`).emit('message', result);
    return result;
}
export async function notify(input: {
    userId: string;
    type: string;
    title: string;
    body: string;
    link?: string;
}, eventId: string) {
    const user = await db.user.findFirst({ where: { id: input.userId, deletedAt: null, bannedAt: null } });
    if (!user)
        return;
    const preferences = user.preferences as {
        inApp?: boolean;
        email?: boolean;
        mutedTypes?: string[];
    };
    if (preferences.mutedTypes?.includes(input.type))
        return;
    if (preferences.inApp !== false) {
        const item = await db.notification.upsert({ where: { id: eventId }, create: { id: eventId, ...input }, update: {} });
        await redis.publish('trendhive:realtime', JSON.stringify({ room: 'user:' + input.userId, event: 'notification', data: item }));
    }
    if (preferences.email !== false)
        await db.outboxEvent.upsert({ where: { id: `email-${eventId}` }, create: { id: `email-${eventId}`, type: 'email', payload: { to: user.email, subject: input.title, text: input.body + (input.link ? `\n${input.link}` : '') } }, update: {} });
}
export async function markRead(userId: string, id: string) { await participant(userId, id); const time = new Date(); await db.conversationParticipant.update({ where: { conversationId_userId: { conversationId: id, userId } }, data: { lastReadAt: time } }); realtime?.to(`conversation:${id}`).emit('read', { conversationId: id, userId, readAt: time }); return { readAt: time }; }
