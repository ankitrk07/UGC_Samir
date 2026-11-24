import type { Request, Response, NextFunction, RequestHandler, Express } from 'express';
import type { Role, User } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { z, ZodError } from 'zod';
import pino from 'pino';
import { randomUUID } from 'node:crypto';
import { db, redis } from './db';
import { env } from '../config';
import { opaqueToken, safeEqual, verifyAccess } from './security';
declare global {
    namespace Express {
        interface Request {
            user?: User;
            sessionId?: string;
            requestId: string;
        }
    }
}
export const log = pino({ level: env.LOG_LEVEL, redact: { paths: ['req.headers.authorization', 'req.headers.cookie', 'res.headers["set-cookie"]', 'password', 'passwordHash', 'token', 'accessToken', 'refreshToken', 'payoutDetailsEncrypted', 'detailsEncrypted'], censor: '[REDACTED]' } });
export class AppError extends Error {
    constructor(public status: number, public code: string, message: string) { super(message); }
}
export function assert(condition: unknown, status: number, code: string, message: string): asserts condition { if (!condition)
    throw new AppError(status, code, message); }
export const asyncRoute = (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler => (req, res, next) => { Promise.resolve(fn(req, res, next)).catch(next); };
export const ok = (res: Response, data: unknown, meta: unknown = null, status = 200) => res.status(status).json({ success: true, data, error: null, meta });
export function errorHandler(error: unknown, req: Request, res: Response, _next: NextFunction) {
    let status = 500, code = 'INTERNAL_ERROR', message = 'The service encountered an error.', details: unknown;
    if (error instanceof AppError)
        ({ status, code, message } = error);
    else if (error instanceof ZodError) {
        status = 400;
        code = 'VALIDATION_ERROR';
        message = error.issues[0]?.message ?? 'Invalid input';
        details = error.flatten();
    }
    else if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (['P2002', 'P2034'].includes(error.code)) {
            status = 409;
            code = 'CONFLICT';
            message = 'This request conflicts with an existing record.';
        }
        else if (error.code === 'P2025') {
            status = 404;
            code = 'NOT_FOUND';
            message = 'Record not found.';
        }
    }
    else if (error && typeof error === 'object' && 'status' in error && (error.status === 400 || error.status === 413)) {
        status = error.status;
        code = 'INVALID_BODY';
        message = 'Invalid or oversized request body.';
    }
    if (status >= 500)
        log.error({ err: error, requestId: req.requestId }, 'Request failed');
    res.status(status).json({ success: false, data: null, error: { code, message, ...(details ? { details } : {}) }, meta: { requestId: req.requestId } });
}
export const requestId: RequestHandler = (req, res, next) => { req.requestId = randomUUID(); res.setHeader('X-Request-ID', req.requestId); next(); };
export const authenticate: RequestHandler = asyncRoute(async (req, _res, next) => {
    const bearer = req.headers.authorization?.match(/^Bearer (.+)$/)?.[1];
    const token = bearer ?? req.cookies?.th_access;
    assert(token, 401, 'UNAUTHENTICATED', 'Log in to continue.');
    let decoded: ReturnType<typeof verifyAccess>;
    try {
        decoded = verifyAccess(token);
    }
    catch {
        throw new AppError(401, 'INVALID_SESSION', 'Your session has expired.');
    }
    const [user, session] = await Promise.all([db.user.findFirst({ where: { id: decoded.sub, deletedAt: null, bannedAt: null } }), db.refreshToken.findUnique({ where: { id: decoded.sid } })]);
    assert(user && session && session.userId === user.id && !session.revokedAt && session.expiresAt > new Date(), 401, 'INVALID_SESSION', 'Your session has expired.');
    if (session.family.startsWith('impersonation:') && !['GET', 'HEAD', 'OPTIONS'].includes(req.method))
        throw new AppError(403, 'READ_ONLY_SESSION', 'Impersonation sessions are read-only.');
    req.user = user;
    req.sessionId = session.id;
    next();
});
export const roles = (...allowed: Role[]): RequestHandler => (req, _res, next) => { if (!req.user || !allowed.includes(req.user.role))
    return next(new AppError(403, 'FORBIDDEN', 'You cannot perform this action.')); next(); };
export function requireUser(req: Request): User { assert(req.user, 401, 'UNAUTHENTICATED', 'Log in to continue.'); return req.user; }
export const isAdmin = (user: User) => user.role === 'ADMIN' || user.role === 'SUPERADMIN';
export const pageSchema = z.object({ limit: z.coerce.number().int().min(1).max(100).default(25), offset: z.coerce.number().int().min(0).max(100000).default(0), cursor: z.string().max(100).optional() }).strict();
export function pagination(query: unknown) { const p = pageSchema.passthrough().parse(query); return { take: p.limit, ...(p.cursor ? { cursor: { id: p.cursor }, skip: 1 } : { skip: p.offset }) }; }
export async function audit(req: Request, action: string, resource: string, resourceId?: string, details: Prisma.InputJsonValue = {}) { await db.auditLog.create({ data: { actorId: req.user?.id, action, resource, resourceId, details, ip: req.ip, requestId: req.requestId } }); }
export function rateLimit(scope: string, max: number, seconds: number): RequestHandler {
    return asyncRoute(async (req, res, next) => {
        const key = `rate:${scope}:${req.user?.id ?? req.ip}`;
        const count = Number(await redis.eval("local n=redis.call('INCR',KEYS[1]); if n==1 then redis.call('EXPIRE',KEYS[1],ARGV[1]) end; return n", 1, key, seconds));
        res.setHeader('RateLimit-Limit', max);
        res.setHeader('RateLimit-Remaining', Math.max(0, max - count));
        if (count > max) {
            res.setHeader('Retry-After', seconds);
            throw new AppError(429, 'RATE_LIMITED', 'Please wait before trying again.');
        }
        next();
    });
}
export const cookieOptions = { httpOnly: true, secure: env.NODE_ENV === 'production', sameSite: 'lax' as const, path: '/' };
export const csrf: RequestHandler = (req, res, next) => {
    if (req.method === 'GET' && !req.cookies?.th_csrf) {
        const token = opaqueToken();
        res.cookie('th_csrf', token, { ...cookieOptions, httpOnly: false, maxAge: 604800000 });
        req.cookies = { ...req.cookies, th_csrf: token };
    }
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        const origin = req.headers.origin;
        if (origin && !env.CORS_ORIGINS.split(',').map(x => x.trim()).includes(origin))
            return next(new AppError(403, 'ORIGIN_REJECTED', 'Origin is not allowed.'));
        if ((req.cookies?.th_access || req.cookies?.th_refresh) && !req.headers.authorization) {
            const value = req.headers['x-csrf-token'];
            if (typeof value !== 'string' || typeof req.cookies.th_csrf !== 'string' || !safeEqual(value, req.cookies.th_csrf))
                return next(new AppError(403, 'CSRF_REJECTED', 'Refresh the page before trying again.'));
        }
    }
    next();
};
export type RouteDefinition = {
    method: 'get' | 'post' | 'patch' | 'delete';
    path: string;
    summary: string;
    roles?: Role[];
    auth?: boolean;
    schema?: z.ZodTypeAny;
    query?: z.ZodTypeAny;
    handler: (req: Request, res: Response) => Promise<unknown>;
};
export const registry: RouteDefinition[] = [];
export function route(app: Express, def: RouteDefinition) {
    registry.push(def);
    const handlers: RequestHandler[] = [];
    handlers.push((req, _res, next) => { try {
        z.record(z.string().min(1).max(100).regex(/^[a-zA-Z0-9_-]+$/)).parse(req.params);
        if (!def.query)
            z.object({}).strict().parse(req.query);
        if (!def.schema && !['get'].includes(def.method))
            req.body = z.object({}).strict().parse(req.body ?? {});
        next();
    }
    catch (e) {
        next(e);
    } });
    if (def.auth || def.roles) {
        handlers.push(authenticate);
        if (def.roles)
            handlers.push(roles(...def.roles));
    }
    if (def.schema)
        handlers.push((req, _res, next) => { try {
            req.body = def.schema!.parse(req.body);
            next();
        }
        catch (e) {
            next(e);
        } });
    if (def.query)
        handlers.push((req, _res, next) => { try {
            req.query = def.query!.parse(req.query);
            next();
        }
        catch (e) {
            next(e);
        } });
    handlers.push(asyncRoute(def.handler));
    app[def.method]('/api/v1' + def.path, ...handlers);
}
