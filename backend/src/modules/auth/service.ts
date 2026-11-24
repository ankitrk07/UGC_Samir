import argon2 from 'argon2';
import type { User } from '@prisma/client';
import { db, transaction, outbox, redis } from '../../core/db';
import { accessToken, hash, opaqueToken } from '../../core/security';
import { AppError, assert } from '../../core/http';
import { env } from '../../config';
export const publicUser = (u: User) => ({ id: u.id, name: u.name, email: u.email, role: u.role, emailVerified: !!u.emailVerifiedAt });
export async function issueSession(user: User, family = opaqueToken()) {
    const raw = opaqueToken();
    const session = await db.refreshToken.create({ data: { userId: user.id, tokenHash: hash(raw), family, expiresAt: new Date(Date.now() + 604800000) } });
    return { accessToken: accessToken(user, session.id), refreshToken: raw, expiresIn: 900, authenticated: true, user: publicUser(user) };
}
export async function signup(input: {
    name: string;
    email: string;
    password: string;
    termsAccepted: true;
    role?: 'BRAND' | 'CREATOR';
    billing?: string;
}) {
    const email = input.email.toLowerCase();
    const token = opaqueToken();
    const passwordHash = await argon2.hash(input.password, { type: argon2.argon2id });
    await transaction(async (tx) => {
        const user = await tx.user.create({ data: { email, name: input.name, passwordHash, role: input.role ?? 'BRAND', termsAcceptedAt: new Date(), termsVersion: env.TERMS_VERSION } });
        if (user.role === 'BRAND')
            await tx.brandProfile.create({ data: { userId: user.id, countries: [], platforms: [] } });
        else
            await tx.creatorProfile.create({ data: { userId: user.id, wallet: { create: {} } } });
        await tx.emailVerificationToken.create({ data: { userId: user.id, tokenHash: hash(token), expiresAt: new Date(Date.now() + 86400000) } });
        if (user.role === 'BRAND')
            await tx.subscription.create({ data: { userId: user.id, billing: input.billing ?? 'monthly', trialEndsAt: new Date(Date.now() + 604800000), currentPeriodEnd: new Date(Date.now() + 604800000) } });
        await outbox(tx, 'email', { to: email, subject: 'Verify your TRENDHIVE email', text: `Verify your email: ${env.SITE_URL}/verify-email?token=${token}` });
        await tx.auditLog.create({ data: { actorId: user.id, action: 'TERMS_ACCEPTED', resource: 'User', resourceId: user.id, details: { version: env.TERMS_VERSION } } });
        // Trial requires no payment method and cannot trigger a charge by itself.
    });
    return { authenticated: false, message: env.SMTP_HOST ? 'Check your inbox to verify your email.' : 'Account created. Email verification is pending until email delivery is configured.' };
}
export async function login(email: string, password: string) {
    const user = await db.user.findUnique({ where: { email: email.toLowerCase() } });
    if (user?.lockedUntil && user.lockedUntil > new Date())
        throw new AppError(429, 'ACCOUNT_LOCKED', 'Please wait before trying again.');
    const valid = user?.passwordHash ? await argon2.verify(user.passwordHash, password) : await argon2.verify(await dummyHash, password);
    if (!user || !valid || user.deletedAt || user.bannedAt) {
        if (user)
            await db.user.update({ where: { id: user.id }, data: { failedLogins: { increment: 1 }, ...(user.failedLogins >= 4 ? { lockedUntil: new Date(Date.now() + 900000) } : {}) } });
        throw new AppError(401, 'INVALID_CREDENTIALS', 'Email or password is incorrect.');
    }
    assert(user.emailVerifiedAt, 403, 'EMAIL_UNVERIFIED', 'Verify your email before logging in.');
    await db.user.update({ where: { id: user.id }, data: { failedLogins: 0, lockedUntil: null } });
    return issueSession(user);
}
const dummyHash = argon2.hash('DummyAuthenticationPassword9', { type: argon2.argon2id });
export async function rotate(raw: string) {
    const result = await transaction(async (tx) => {
        const old = await tx.refreshToken.findUnique({ where: { tokenHash: hash(raw) }, include: { user: true } });
        assert(old, 401, 'INVALID_REFRESH', 'Session expired.');
        assert(!old.family.startsWith('impersonation:'), 403, 'READ_ONLY_SESSION', 'Impersonation sessions cannot be refreshed.');
        if (old.revokedAt) {
            await tx.refreshToken.updateMany({ where: { family: old.family }, data: { revokedAt: new Date() } });
            return null;
        }
        assert(old.expiresAt > new Date() && !old.user.deletedAt && !old.user.bannedAt, 401, 'INVALID_REFRESH', 'Session expired.');
        const next = opaqueToken();
        const replacement = await tx.refreshToken.create({ data: { userId: old.userId, tokenHash: hash(next), family: old.family, expiresAt: new Date(Date.now() + 604800000) } });
        await tx.refreshToken.update({ where: { id: old.id }, data: { revokedAt: new Date(), replacedBy: replacement.id } });
        return { accessToken: accessToken(old.user, replacement.id), refreshToken: next, expiresIn: 900, authenticated: true, user: publicUser(old.user) };
    });
    assert(result, 401, 'REFRESH_REUSE', 'Session revoked. Log in again.');
    return result;
}
export async function sendToken(email: string, kind: 'reset' | 'verify') {
    if (!env.SMTP_HOST) return { message: 'Email delivery is not configured yet. Please try again after it is enabled.' };
    const user = await db.user.findUnique({ where: { email: email.toLowerCase() } });
    if (user && !user.deletedAt && !user.bannedAt && (kind === 'reset' || !user.emailVerifiedAt)) {
        const raw = opaqueToken();
        await transaction(async (tx) => {
            const data = { userId: user.id, tokenHash: hash(raw), expiresAt: new Date(Date.now() + (kind === 'reset' ? 3600000 : 86400000)) };
            if (kind === 'reset')
                await tx.passwordResetToken.create({ data });
            else
                await tx.emailVerificationToken.create({ data });
            await outbox(tx, 'email', { to: user.email, subject: kind === 'reset' ? 'Reset your TRENDHIVE password' : 'Verify your TRENDHIVE email', text: `${env.SITE_URL}/${kind === 'reset' ? 'reset-password' : 'verify-email'}?token=${raw}` });
        });
    }
    return { message: 'If the account exists, an email has been sent.' };
}
export async function consumeToken(raw: string, kind: 'reset' | 'verify', password?: string) {
    const passwordHash = password ? await argon2.hash(password, { type: argon2.argon2id }) : undefined;
    await transaction(async (tx) => {
        const record = kind === 'reset' ? await tx.passwordResetToken.findUnique({ where: { tokenHash: hash(raw) } }) : await tx.emailVerificationToken.findUnique({ where: { tokenHash: hash(raw) } });
        assert(record && !record.usedAt && record.expiresAt > new Date(), 400, 'INVALID_TOKEN', 'This link is invalid or expired.');
        if (kind === 'reset') {
            await tx.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } });
            await tx.user.update({ where: { id: record.userId }, data: { passwordHash, failedLogins: 0, lockedUntil: null } });
            await tx.refreshToken.updateMany({ where: { userId: record.userId }, data: { revokedAt: new Date() } });
        }
        else {
            await tx.emailVerificationToken.update({ where: { id: record.id }, data: { usedAt: new Date() } });
            const user = await tx.user.update({ where: { id: record.userId }, data: { emailVerifiedAt: new Date() } });
            if (user.role === 'BRAND' && await tx.subscription.count({ where: { userId: user.id } }) === 0)
                await tx.subscription.create({ data: { userId: user.id, trialEndsAt: new Date(Date.now() + 604800000), currentPeriodEnd: new Date(Date.now() + 604800000) } });
        }
    });
    return { message: kind === 'reset' ? 'Password updated. Please log in.' : 'Email verified. Please log in.' };
}
export async function googleStart(frontendState?: string) {
    assert(env.GOOGLE_CLIENT_ID, 503, 'PROVIDER_UNAVAILABLE', 'Google login is not configured.');
    const state = opaqueToken();
    const verifier = opaqueToken();
    const challenge = Buffer.from(hash(verifier), 'hex').toString('base64url');
    await redis.set(`oauth:${hash(state)}`, JSON.stringify({ verifier, frontendState }), 'EX', 600);
    const params = new URLSearchParams({ client_id: env.GOOGLE_CLIENT_ID, redirect_uri: `${env.API_URL}/api/v1/auth/google/callback`, response_type: 'code', scope: 'openid email profile', state, code_challenge: challenge, code_challenge_method: 'S256' });
    return { state, url: `https://accounts.google.com/o/oauth2/v2/auth?${params}` };
}
export async function googleFinish(code: string, state: string) {
    const stored = await redis.getdel(`oauth:${hash(state)}`);
    assert(stored && env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET, 400, 'INVALID_OAUTH', 'OAuth request expired.');
    const { verifier, frontendState } = JSON.parse(stored) as {
        verifier: string;
        frontendState?: string;
    };
    assert(typeof verifier === 'string', 400, 'INVALID_OAUTH', 'OAuth verifier is invalid.');
    const response = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', body: new URLSearchParams({ code, client_id: env.GOOGLE_CLIENT_ID, client_secret: env.GOOGLE_CLIENT_SECRET, redirect_uri: `${env.API_URL}/api/v1/auth/google/callback`, grant_type: 'authorization_code', code_verifier: verifier }), signal: AbortSignal.timeout(10000) });
    const data = await response.json() as {
        access_token?: string;
    };
    assert(response.ok && data.access_token, 400, 'INVALID_OAUTH', 'Google authentication failed.');
    const profileResponse = await fetch('https://openidconnect.googleapis.com/v1/userinfo', { headers: { Authorization: `Bearer ${data.access_token}` }, signal: AbortSignal.timeout(10000) });
    const profile = await profileResponse.json() as {
        sub?: string;
        email?: string;
        email_verified?: boolean;
        name?: string;
    };
    assert(profileResponse.ok && profile.sub && profile.email && profile.email_verified, 403, 'UNVERIFIED_OAUTH', 'A verified Google email is required.');
    let account = await db.oAuthAccount.findUnique({ where: { provider_providerAccountId: { provider: 'google', providerAccountId: profile.sub } }, include: { user: true } });
    if (!account) {
        const existing = await db.user.findUnique({ where: { email: profile.email.toLowerCase() } });
        assert(!existing, 409, 'ACCOUNT_LINK_REQUIRED', 'Log in with your existing password to use this account.');
        account = await db.oAuthAccount.create({ data: { provider: 'google', providerAccountId: profile.sub, user: { create: { email: profile.email.toLowerCase(), name: profile.name ?? 'Creator', emailVerifiedAt: new Date(), brand: { create: { countries: [], platforms: [] } }, subscriptions: { create: { trialEndsAt: new Date(Date.now() + 604800000), currentPeriodEnd: new Date(Date.now() + 604800000) } } } } }, include: { user: true } });
    }
    assert(!account.user.deletedAt && !account.user.bannedAt, 403, 'ACCOUNT_UNAVAILABLE', 'This account is unavailable.');
    return { ...await issueSession(account.user), requiresTerms: !account.user.termsAcceptedAt, frontendState };
}
