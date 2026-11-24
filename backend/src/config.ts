import { config as loadEnv } from 'dotenv';
import { resolve } from 'node:path';
import { z } from 'zod';
// src/config.ts and dist/config.js both resolve the backend workspace .env.
// Environment variables supplied by the host retain precedence.
loadEnv({ path: resolve(__dirname, '../.env') });
function blankToUndefined(value: unknown) { return typeof value === 'string' && !value.trim() ? undefined : value; }
const schema = z.object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().min(1).max(65535).default(4000),
    DATABASE_URL: z.string().url().refine(v => ['postgres:', 'postgresql:'].includes(new URL(v).protocol), 'Use a PostgreSQL connection URL.'),
    REDIS_URL: z.string().url().refine(v => ['redis:', 'rediss:'].includes(new URL(v).protocol), 'Use a Redis connection URL.'),
    JWT_SECRET: z.string().min(32), ENCRYPTION_KEY: z.string().regex(/^[a-f\d]{64}$/i),
    SITE_URL: z.string().url().default('http://localhost:3000'),
    API_URL: z.string().url().default('http://localhost:4000'),
    CORS_ORIGINS: z.string().default('http://localhost:3000'),
    TRUST_PROXY: z.coerce.number().int().min(0).default(0),
    SMTP_HOST: z.preprocess(blankToUndefined, z.string().min(1).optional()),
    SMTP_PORT: z.preprocess(blankToUndefined, z.coerce.number().int().min(1).max(65535).optional()),
    SMTP_USER: z.preprocess(blankToUndefined, z.string().optional()), SMTP_PASSWORD: z.preprocess(blankToUndefined, z.string().optional()),
    EMAIL_FROM: z.preprocess(blankToUndefined, z.string().min(1).optional()),
    STRIPE_SECRET_KEY: z.string().optional(), STRIPE_WEBHOOK_SECRET: z.string().optional(),
    RAZORPAY_KEY_ID: z.string().optional(), RAZORPAY_KEY_SECRET: z.string().optional(), RAZORPAY_WEBHOOK_SECRET: z.string().optional(),
    GOOGLE_CLIENT_ID: z.string().optional(), GOOGLE_CLIENT_SECRET: z.string().optional(),
    S3_REGION: z.string().default('ap-south-1'), S3_BUCKET: z.string().optional(),
    S3_ENDPOINT: z.string().url().optional(), CDN_URL: z.string().url().optional(),
    SCANNER_URL: z.string().url().optional(), SCANNER_SECRET: z.string().optional(),
    MOCK_SOCIAL_BIO: z.string().optional(),
    SOCIAL_MODE: z.enum(['mock', 'live']).default('mock'),
    MEETING_LINK: z.string().url().optional(),
    TERMS_VERSION: z.string().min(1).max(100).default('2026-11-11'),
    LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error', 'silent']).default('info'),
});
export function parseEnv(input: NodeJS.ProcessEnv) {
    const result = schema.parse(input);
    const smtp = [result.SMTP_HOST, result.SMTP_PORT, result.EMAIL_FROM];
    if (smtp.some(Boolean) && !smtp.every(Boolean)) throw new Error('SMTP requires SMTP_HOST, SMTP_PORT and EMAIL_FROM together; leave all blank to disable delivery.');
    if (Boolean(result.SMTP_USER) !== Boolean(result.SMTP_PASSWORD) || (result.SMTP_USER && !result.SMTP_HOST)) throw new Error('SMTP credentials require a configured SMTP server and both user/password.');
    for (const value of [result.SITE_URL, result.API_URL, ...result.CORS_ORIGINS.split(',').map(x => x.trim())]) {
        let parsed: URL;
        try { parsed = new URL(value); } catch { throw new Error('Site/API/CORS values must be exact HTTP(S) origins.'); }
        if (!['http:', 'https:'].includes(parsed.protocol) || parsed.origin !== value || parsed.username || parsed.password)
            throw new Error('Site/API/CORS values must be exact HTTP(S) origins without a path or credentials.');
    }
    if (result.NODE_ENV === 'production') {
        if (/development-only|test-only|replace-with/i.test(result.JWT_SECRET) || result.ENCRYPTION_KEY === '0123456789abcdef'.repeat(4) || /^(.)\1+$/.test(result.ENCRYPTION_KEY)) throw new Error('Production signing/encryption secrets must be independently generated');
        if (!result.SITE_URL.startsWith('https://') || !result.API_URL.startsWith('https://'))
            throw new Error('Production URLs must use HTTPS');
        if (result.CORS_ORIGINS.split(',').some(x => x.trim() === '*' || !x.trim().startsWith('https://')))
            throw new Error('Production CORS requires explicit HTTPS origins');
        if (result.SOCIAL_MODE === 'mock')
            throw new Error('Mock social data is disabled in production');
    }
    return result;
}
export const env = parseEnv(process.env);
