import { Queue } from 'bullmq';
import Redis from 'ioredis';
import { env } from './config';
export const queueConnection = new Redis(env.REDIS_URL, { maxRetriesPerRequest: null, lazyConnect: true });
export const jobs = new Queue('trendhive', { connection: queueConnection, defaultJobOptions: { attempts: 5, backoff: { type: 'exponential', delay: 5000 }, removeOnComplete: { count: 1000 }, removeOnFail: { count: 5000 } } });
