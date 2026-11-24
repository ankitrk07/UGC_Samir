import { createHash, randomBytes, createCipheriv, createDecipheriv, timingSafeEqual, createHmac } from 'node:crypto';
import jwt from 'jsonwebtoken';
import type { Role } from '@prisma/client';
import { env } from '../config';
export const opaqueToken = () => randomBytes(32).toString('hex');
export const hash = (value: string | Buffer) => createHash('sha256').update(value).digest('hex');
// Authorization codes and booking/verification tokens may occur in query strings.
export function requestLogPath(rawUrl = '') { return rawUrl.split(/[?#]/, 1)[0]!.replace(/[\r\n]/g, ''); }
export const safeEqual = (a: string, b: string) => { const left=Buffer.from(a),right=Buffer.from(b);return left.length===right.length && timingSafeEqual(left,right); };
export function hmacValid(body: Buffer, signature: string, secret: string) { return safeEqual(createHmac('sha256', secret).update(body).digest('hex'), signature); }
export function encrypt(value: unknown): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', Buffer.from(env.ENCRYPTION_KEY, 'hex'), iv);
    const ciphertext = Buffer.concat([cipher.update(JSON.stringify(value), 'utf8'), cipher.final()]);
    return [iv, cipher.getAuthTag(), ciphertext].map(x => x.toString('base64url')).join('.');
}
export function decrypt(value: string): unknown {
    const parts = value.split('.').map(x => Buffer.from(x, 'base64url'));
    if (parts.length !== 3)
        throw new Error('Invalid ciphertext');
    const cipher = createDecipheriv('aes-256-gcm', Buffer.from(env.ENCRYPTION_KEY, 'hex'), parts[0]!);
    cipher.setAuthTag(parts[1]!);
    return JSON.parse(Buffer.concat([cipher.update(parts[2]!), cipher.final()]).toString());
}
export function accessToken(user: {
    id: string;
    role: Role;
}, sessionId: string) {
    return jwt.sign({ role: user.role, sid: sessionId }, env.JWT_SECRET, { subject: user.id, issuer: 'trendhive', audience: 'trendhive-api', expiresIn: '15m', algorithm: 'HS256' });
}
export function verifyAccess(token: string): {
    sub: string;
    role: Role;
    sid: string;
    exp: number;
} {
    const decoded = jwt.verify(token, env.JWT_SECRET, { issuer: 'trendhive', audience: 'trendhive-api', algorithms: ['HS256'] });
    if (typeof decoded === 'string' || typeof decoded.sub !== 'string' || typeof decoded.sid !== 'string' || typeof decoded.exp !== 'number')
        throw new Error('Invalid access token');
    return decoded as { sub: string; role: Role; sid: string; exp:number; };
}
export function csvCell(value: unknown): string { return '"' + String(value ?? '').replace(/^[=+@\-\t\r]/, match => "'" + match).replace(/"/g, '""') + '"'; }
