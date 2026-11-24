import { PrismaClient, Prisma } from '@prisma/client';
import Redis from 'ioredis';
import { env } from '../config';
export const db = new PrismaClient();
export const redis = new Redis(env.REDIS_URL, { lazyConnect: true, maxRetriesPerRequest: 1 });
export async function transaction<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    for (let attempt = 0;; attempt++) {
        try {
            return await db.$transaction(fn, { isolationLevel: 'Serializable', timeout: 15000 });
        }
        catch (e) {
            if (!(e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2034') || attempt >= 3)
                throw e;
        }
    }
}
export async function outbox(tx: Prisma.TransactionClient, type: string, payload: Prisma.InputJsonValue) {
    return tx.outboxEvent.create({ data: { type, payload } });
}
export async function cached<T>(key: string, ttl: number, fn: () => Promise<T>): Promise<T> {
    const existing = await redis.get(key);
    if (existing)
        return JSON.parse(existing) as T;
    const result = await fn();
    await redis.set(key, JSON.stringify(result), 'EX', ttl);
    return result;
}
