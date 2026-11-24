import request from 'supertest';
import { randomUUID } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Role } from '@prisma/client';
import { createApp } from '../../src/app';
import { registry } from '../../src/core/http';
import { db, redis } from '../../src/core/db';
import { jobs, queueConnection } from '../../src/jobs';
import { issueSession } from '../../src/modules/auth/service';

// This sweep tests HTTP access/validation boundaries for every registered route.
// It is not happy-path, cross-owner, provider, or complete operation acceptance.
const app = createApp();
const definitions = [...registry];
const roles: Role[] = ['BRAND', 'CREATOR', 'ADMIN', 'SUPERADMIN'];
const tokens = new Map<Role, string>();
const users: string[] = [];
type Outcome = 'NOT_RUN' | 'PASS' | 'FAIL' | 'NOT_APPLICABLE';
const results = definitions.map(r => ({ method: r.method, path: r.path, authentication: 'NOT_RUN' as Outcome, authorization: 'NOT_RUN' as Outcome, validation: 'NOT_RUN' as Outcome, happyPath: 'NOT_RUN' }));

beforeAll(async () => {
  await db.$connect(); await redis.ping();
  for (const role of roles) {
    const user = await db.user.create({ data: { email: 'sweep-' + randomUUID() + '@test.invalid', name: 'API access fixture', role, emailVerifiedAt: new Date() } });
    users.push(user.id); tokens.set(role, (await issueSession(user)).accessToken);
  }
});
beforeEach(async () => {
  // Only the isolated test rate namespace; do not flush BullMQ/session data.
  let cursor = '0';
  do { const page = await redis.scan(cursor, 'MATCH', 'rate:*', 'COUNT', 200); cursor = page[0]; if (page[1].length) await redis.del(...page[1]); } while (cursor !== '0');
});
afterAll(async () => {
  const directory = resolve(__dirname, '../../../coverage'); mkdirSync(directory, { recursive: true });
  writeFileSync(resolve(directory, 'api-access-validation.json'), JSON.stringify({ executedAt: new Date().toISOString(), limitation: 'Access and malformed-request checks only. Happy-path/ownership/provider tests remain separate.', results }, null, 2));
  if (users.length) { await db.refreshToken.deleteMany({ where: { userId: { in: users } } }); await db.user.deleteMany({ where: { id: { in: users } } }); }
  await jobs.close(); await Promise.all([db.$disconnect(), redis.quit(), queueConnection.quit()]);
});

for (const [index, definition] of definitions.entries()) {
  test(definition.method.toUpperCase() + ' ' + definition.path + ' HTTP access/validation', async () => {
    const result = results[index]!;
    const url = '/api/v1' + definition.path.replace(/:[a-zA-Z]+/g, 'verification-missing');
    const call = (token?: string, invalid = false) => {
      const req = request(app)[definition.method](url);
      if (token) req.set('Authorization', 'Bearer ' + token);
      if (definition.method === 'get') { if (invalid) req.query({ __unexpected_verification_input: '1' }); }
      else req.send(invalid ? { __unexpected_verification_input: true } : {});
      return req;
    };
    if (definition.auth || definition.roles) {
      result.authentication = 'FAIL'; const response = await call(); expect(response.status).toBe(401); expect(response.body.success).toBe(false); result.authentication = 'PASS';
    } else result.authentication = 'NOT_APPLICABLE';
    const forbiddenRole = definition.roles && roles.find(role => !definition.roles!.includes(role));
    if (forbiddenRole) {
      result.authorization = 'FAIL'; const response = await call(tokens.get(forbiddenRole)); expect(response.status).toBe(403); result.authorization = 'PASS';
    } else result.authorization = 'NOT_APPLICABLE';
    if (definition.method === 'get' || definition.schema) {
      const token = definition.auth || definition.roles ? tokens.get(definition.roles?.[0] ?? 'BRAND') : undefined;
      result.validation = 'FAIL'; const response = await call(token, true); expect(response.status).toBe(400); expect(response.body.error.code).toBe('VALIDATION_ERROR'); result.validation = 'PASS';
    } else result.validation = 'NOT_APPLICABLE';
  });
}
for (const provider of ['stripe', 'razorpay']) {
  test(provider + ' raw webhook rejects missing signatures', async () => {
    const response = await request(app).post('/api/v1/payments/webhooks/' + provider).set('Content-Type', 'application/json').send('{}');
    expect(response.status).toBe(400); expect(response.body.error.code).toBe('SIGNATURE_REQUIRED');
  });
}
