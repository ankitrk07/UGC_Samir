import { encrypt, decrypt, accessToken, verifyAccess, hash, hmacValid, csvCell, safeEqual, opaqueToken } from '../../src/core/security';
import { createHmac } from 'node:crypto';
describe('cryptographic boundaries', () => {
    test('AES GCM uses a fresh nonce and rejects tampering', () => { const value = { method: 'UPI', upi: 'creator@bank' }; const a = encrypt(value), b = encrypt(value); expect(a).not.toBe(b); expect(decrypt(a)).toEqual(value); const pieces = a.split('.'); pieces[2] = Buffer.from('tampered').toString('base64url'); expect(() => decrypt(pieces.join('.'))).toThrow(); expect(() => decrypt('invalid')).toThrow(); });
    test('JWT binds subject, role, session, audience and expiry', () => { const token = accessToken({ id: 'u1', role: 'CREATOR' }, 's1'); expect(verifyAccess(token)).toMatchObject({ sub: 'u1', role: 'CREATOR', sid: 's1' }); expect(() => verifyAccess(token + 'x')).toThrow(); });
    test('opaque secrets are unique and hashes do not store plaintext', () => { const token = opaqueToken(); expect(token).toHaveLength(64); expect(opaqueToken()).not.toBe(token); expect(hash(token)).toHaveLength(64); expect(hash(token)).not.toBe(token); });
    test('HMAC verifies exact bytes and rejects alterations', () => { const body = Buffer.from('{"amount":100}'); const signature = createHmac('sha256', 'secret').update(body).digest('hex'); expect(hmacValid(body, signature, 'secret')).toBe(true); expect(hmacValid(Buffer.from('{}'), signature, 'secret')).toBe(false); expect(hmacValid(body, 'invalid', 'secret')).toBe(false); expect(safeEqual('a', 'long')).toBe(false); });
    test.each(['=SUM(A1)', '+1', '-1', '@cmd', '\tformula', '\rformula'])('CSV neutralizes spreadsheet formulas: %p', v => expect(csvCell(v)).toBe("\"'" + v + "\""));
    test('CSV quotes separators and quotes', () => expect(csvCell('a,"b')).toBe('"a,""b"'));
});
