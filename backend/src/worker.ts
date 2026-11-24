import { Worker, UnrecoverableError, DelayedError } from 'bullmq';
import nodemailer from 'nodemailer';
import { env } from './config';
import { db, redis, transaction } from './core/db';
import { AppError, log } from './core/http';
import { jobs, queueConnection } from './jobs';
import { syncPost } from './modules/social/jobs';
import { processMedia,purgeMedia } from './modules/media/jobs';
import { processRefund } from './modules/payments/refunds';
import { notify } from './modules/chat/service';
import { z } from 'zod';
const transport = env.SMTP_HOST && env.SMTP_PORT && env.EMAIL_FROM ? nodemailer.createTransport({ host: env.SMTP_HOST, port: env.SMTP_PORT, secure: env.SMTP_PORT === 465, ...(env.SMTP_USER ? { auth: { user: env.SMTP_USER, pass: env.SMTP_PASSWORD } } : {}) }) : null;
async function processOutbox(id: string) {
    const event = await db.outboxEvent.findUnique({ where: { id } });
    if (!event || event.processedAt)
        return;
    const p = event.payload;
    try {
        if (event.type === 'email') {
            if (!transport) throw new Error('Email delivery is disabled.');
            const data = z.object({ to: z.string().email(), subject: z.string().max(500), text: z.string().max(50000), calendar: z.string().optional() }).parse(p);
            await transport.sendMail({ from: env.EMAIL_FROM, to: data.to, subject: data.subject, text: data.text, messageId: `<${id}@trendhive>`, ...(data.calendar ? { icalEvent: { method: 'REQUEST', content: data.calendar } } : {}) });
        }
        else if (event.type === 'notification')
            await notify(z.object({ userId: z.string(), type: z.string(), title: z.string(), body: z.string(), link: z.string().optional() }).parse(p), id);
        else if (event.type === 'refund.process')
            await processRefund(z.object({ refundId: z.string() }).parse(p).refundId);
        else if(event.type==='media.purge')await purgeMedia(z.object({assetId:z.string()}).parse(p).assetId);
        else if (event.type === 'media.process')
            await processMedia(z.object({ assetId: z.string() }).parse(p).assetId);
        else
            throw new UnrecoverableError(`Unknown outbox event: ${event.type}`);
        await db.outboxEvent.update({ where: { id }, data: { processedAt: new Date(), attempts: { increment: 1 }, lastError: null } });
    }
    catch (e) {
        if (event.type === 'media.process' && e instanceof AppError && e.status >= 400 && e.status < 500) {
            const assetId = (p as {
                assetId: string;
            }).assetId;
            await db.mediaAsset.updateMany({ where: { id: assetId }, data: { scanStatus: 'REJECTED' } });
        }
        await db.outboxEvent.update({ where: { id }, data: { attempts: { increment: 1 }, lastError: e instanceof Error ? e.message.slice(0, 1000) : 'Job failed' } });
        throw e;
    }
}
async function lifecycle() {
    const now = new Date();
    const trials = await db.subscription.findMany({ where: { status: 'TRIALING', deletedAt: null, trialEndsAt: { lte: new Date(Date.now() + 86400000) } }, include: { user: true }, take: 500 });
    for (const sub of trials)
        await transaction(async (tx) => { if (sub.trialEndsAt! <= now && !sub.providerSubId)
            await tx.subscription.update({ where: { id: sub.id }, data: { status: 'EXPIRED' } }); await tx.outboxEvent.upsert({ where: { id: `trial-ending-${sub.id}` }, create: { id: `trial-ending-${sub.id}`, type: 'email', payload: { to: sub.user.email, subject: 'Your TRENDHIVE trial is ending', text: 'Choose a paid plan to continue. You will not be charged without setting up a subscription.' } }, update: {} }); });
    const calls = await db.bookCall.findMany({ where: { status: 'CONFIRMED', deletedAt: null, reminderSentAt: null, slot: { startsAt: { gte: now, lte: new Date(Date.now() + 3600000) } } }, include: { slot: true }, take: 500 });
    for (const b of calls)
        await transaction(async (tx) => { await tx.outboxEvent.upsert({ where: { id: `booking-reminder-${b.id}-${b.slotId}` }, create: { id: `booking-reminder-${b.id}-${b.slotId}`, type: 'email', payload: { to: b.email, subject: 'Your TRENDHIVE call starts soon', text: `Your call is at ${b.slot.startsAt.toISOString()}. ${b.meetingLink ?? ''}` } }, update: {} }); await tx.bookCall.update({ where: { id: b.id }, data: { reminderSentAt: now } }); });
}
export async function startWorker() {
    await Promise.all([jobs.upsertJobScheduler('outbox', { every: 10000 }, { name: 'outbox', data: {} }), jobs.upsertJobScheduler('social-sync', { pattern: '0 */2 * * *' }, { name: 'social-sync', data: {} }), jobs.upsertJobScheduler('lifecycle', { every: 60000 }, { name: 'lifecycle', data: {} })]);
    const worker = new Worker('trendhive', async (job, token) => {
        if (job.name === 'outbox') {
            // Exhausted events remain visible for investigation without starving later work.
            const events = await db.outboxEvent.findMany({ where: { processedAt: null, attempts: { lt: 5 }, ...(!transport ? { type: { not: 'email' } } : {}) }, take: 200, orderBy: { createdAt: 'asc' } });
            for (const e of events)
                await jobs.add('process-outbox', { id: e.id }, { jobId: `outbox-${e.id}` });
        }
        else if (job.name === 'process-outbox') {
            const id = z.object({ id: z.string() }).parse(job.data).id;
            if (!transport) {
                const event = await db.outboxEvent.findUnique({ where: { id } });
                if (event?.type === 'email' && !event.processedAt) {
                    // Preserve queued mail without acknowledging delivery or consuming retries.
                    await job.moveToDelayed(Date.now() + 60000, token);
                    throw new DelayedError();
                }
            }
            await processOutbox(id);
        }
        else if (job.name === 'social-sync') {
            let cursor: string | undefined;
            for (;;) {
                const posts = await db.post.findMany({ where: { status: 'LIVE', deletedAt: null, campaign: { deletedAt: null } }, take: 200, orderBy: { id: 'asc' }, ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}) });
                for (const p of posts)
                    await jobs.add('sync-post', { postId: p.id }, { jobId: `sync-${p.id}-${Math.floor(Date.now() / 7200000)}` });
                if (posts.length < 200)
                    break;
                cursor = posts[posts.length - 1]!.id;
            }
        }
        else if (job.name === 'sync-post') {
            try {
                await syncPost(z.object({ postId: z.string() }).parse(job.data).postId);
            }
            catch (e) {
                if (e instanceof AppError && [400, 403, 404, 409].includes(e.status))
                    throw new UnrecoverableError(e.message);
                throw e;
            }
        }
        else if (job.name === 'lifecycle')
            await lifecycle();
        else
            throw new UnrecoverableError('Unsupported job type: ' + job.name);
    }, { connection: queueConnection, concurrency: 5, limiter: { max: 60, duration: 60000 } });
    worker.on('failed', (job, error) => log.error({ jobId: job?.id, jobName: job?.name, err: error }, 'Job failed'));
    worker.on('error', error => log.error({ err: error }, 'Worker error'));
    const close = async () => { await worker.close(); await jobs.close(); await queueConnection.quit(); await redis.quit().catch(() => undefined); await db.$disconnect(); transport?.close(); };
    process.once('SIGTERM', () => { void close().then(() => process.exit(0)); });
    process.once('SIGINT', () => { void close().then(() => process.exit(0)); });
    return { worker, close };
}
if (require.main === module)
    startWorker().catch(error => { log.fatal({ err: error }, 'Worker could not start'); process.exit(1); });
