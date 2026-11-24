import type { Express, Response } from 'express';
import { z } from 'zod';
import argon2 from 'argon2';
import { route, ok, cookieOptions, assert, requireUser, audit, rateLimit } from '../../core/http';
import { env } from '../../config';
import { db, redis, transaction } from '../../core/db';
import { hash, safeEqual, opaqueToken, encrypt, decrypt } from '../../core/security';
import * as service from './service';
export const email = z.string().trim().email().max(254).transform(x => x.toLowerCase());
export const password = z.string().min(8).max(128).regex(/[A-Z]/, 'Include an uppercase letter.').regex(/[0-9]/, 'Include a number.');
export const tokenSchema = z.object({ token: z.string().min(32).max(2048) }).strict();
function sessionResponse(res: Response, data: Awaited<ReturnType<typeof service.issueSession>>) {
    res.cookie('th_access', data.accessToken, { ...cookieOptions, maxAge: 900000 });
    res.cookie('th_refresh', data.refreshToken, { ...cookieOptions, maxAge: 604800000 });
    return ok(res, data);
}
export function authRoutes(app: Express) {
    route(app, { method: 'get', path: '/auth/csrf', summary: 'Get double-submit CSRF token for native cookie clients', handler: async (req, res) => ok(res, { csrfToken: req.cookies.th_csrf }) });
    route(app, { method: 'post', path: '/auth/google/exchange', summary: 'Consume one-time OAuth exchange code', schema: z.object({ code: z.string().regex(/^[a-f0-9]{64}$/) }).strict(), handler: async (req, res) => { const value = await redis.getdel('oauth-exchange:' + hash(req.body.code)); assert(value, 400, 'INVALID_OAUTH', 'OAuth exchange expired.'); return ok(res, decrypt(value)); } });
    app.use('/api/v1/auth', rateLimit('auth', 30, 900));
    route(app, { method: 'post', path: '/auth/signup', summary: 'Register a brand or creator', schema: z.object({ name: z.string().trim().min(2).max(100), email, password, termsAccepted: z.literal(true), role: z.enum(['BRAND', 'CREATOR']).optional(), plan: z.literal('self-service').optional(), billing: z.enum(['monthly', 'annual']).optional() }).strict(), handler: async (req, res) => ok(res, await service.signup(req.body), null, 201) });
    route(app, { method: 'post', path: '/auth/login', summary: 'Login', schema: z.object({ email, password: z.string().min(1).max(128) }).strict(), handler: async (req, res) => sessionResponse(res, await service.login(req.body.email, req.body.password)) });
    route(app, { method: 'get', path: '/auth/me', summary: 'Current account', auth: true, handler: async (req, res) => ok(res, { user: service.publicUser(requireUser(req)) }) });
    route(app, { method: 'post', path: '/auth/refresh', summary: 'Rotate refresh token', schema: z.object({ refreshToken: z.string().max(2048).optional() }).strict(), handler: async (req, res) => { const raw = req.cookies?.th_refresh ?? req.body.refreshToken; assert(typeof raw === 'string', 401, 'INVALID_REFRESH', 'Session expired.'); return sessionResponse(res, await service.rotate(raw)); } });
    for (const all of [false, true])
        route(app, { method: 'post', path: all ? '/auth/logout-all' : '/auth/logout', summary: all ? 'Revoke all sessions' : 'Logout', auth: true, schema: z.object({}).strict(), handler: async (req, res) => { await db.refreshToken.updateMany({ where: { userId: requireUser(req).id, ...(all ? {} : { id: req.sessionId }) }, data: { revokedAt: new Date() } }); res.clearCookie('th_access', cookieOptions); res.clearCookie('th_refresh', cookieOptions); await audit(req, all ? 'LOGOUT_ALL' : 'LOGOUT', 'User', req.user!.id); return ok(res, { message: 'You are logged out.' }); } });
    for (const [path, kind] of [['forgot-password', 'reset'], ['resend-verification', 'verify']] as const)
        route(app, { method: 'post', path: '/auth/' + path, summary: path, schema: z.object({ email }).strict(), handler: async (req, res) => ok(res, await service.sendToken(req.body.email, kind)) });
    route(app, { method: 'post', path: '/auth/reset-password', summary: 'Reset password', schema: tokenSchema.extend({ password }), handler: async (req, res) => ok(res, await service.consumeToken(req.body.token, 'reset', req.body.password)) });
    route(app, { method: 'post', path: '/auth/verify-email', summary: 'Verify email', schema: tokenSchema, handler: async (req, res) => ok(res, await service.consumeToken(req.body.token, 'verify')) });
    route(app, { method: 'post', path: '/auth/change-password', summary: 'Change password and revoke sessions', auth: true, schema: z.object({ currentPassword: z.string().min(1).max(128), password }).strict(), handler: async (req, res) => { const user = requireUser(req); assert(user.passwordHash && await argon2.verify(user.passwordHash, req.body.currentPassword), 400, 'INVALID_PASSWORD', 'Current password is incorrect.'); const passwordHash = await argon2.hash(req.body.password); await transaction(async (tx) => { await tx.user.update({ where: { id: user.id }, data: { passwordHash } }); await tx.refreshToken.updateMany({ where: { userId: user.id }, data: { revokedAt: new Date() } }); }); await audit(req, 'PASSWORD_CHANGED', 'User', user.id); res.clearCookie('th_access', cookieOptions); res.clearCookie('th_refresh', cookieOptions); return ok(res, { message: 'Password changed. Log in again.' }); } });
    route(app, { method: 'get', path: '/auth/google', summary: 'Begin Google OAuth with PKCE', query: z.object({ frontendState: z.string().regex(/^[a-f0-9]{64}$/).optional() }).strict(), handler: async (req, res) => { const data = await service.googleStart(req.query.frontendState as string | undefined); res.cookie('th_oauth', hash(data.state), { ...cookieOptions, maxAge: 600000 }); return res.redirect(data.url); } });
    route(app, { method: 'get', path: '/auth/google/callback', summary: 'Google callback', query: z.object({ code: z.string().max(4096), state: z.string().max(128) }).strict(), handler: async (req, res) => { const state = String(req.query.state); assert(typeof req.cookies?.th_oauth === 'string' && safeEqual(hash(state), req.cookies.th_oauth), 400, 'INVALID_OAUTH', 'OAuth state does not match.'); res.clearCookie('th_oauth', cookieOptions); const data = await service.googleFinish(String(req.query.code), state); const code = opaqueToken(); await redis.set('oauth-exchange:' + hash(code), encrypt({ ...data, termsVersion: env.TERMS_VERSION }), 'EX', 60); return res.redirect(env.SITE_URL + '/auth/google/callback?code=' + code); } });
}
