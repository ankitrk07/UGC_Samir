// These execute the actual payment service with in-memory I/O doubles.
// They do not test Prisma, database isolation, or provider SDK integration.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const ts = require('typescript');

class AppError extends Error {
  constructor(status, code, message) { super(message); this.status = status; this.code = code; }
}
function ensure(value, status, code, message) { if (!value) throw new AppError(status, code, message); }
function load(file, dependencies) {
  const source = ts.transpileModule(fs.readFileSync(path.resolve(__dirname, '..', file), 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, esModuleInterop: true },
  }).outputText;
  const module = { exports: {} };
  vm.runInThisContext('(function(require,module,exports){' + source + '\n})', { filename: file })(name => {
    if (Object.hasOwn(dependencies, name)) return dependencies[name];
    if (name.startsWith('node:')) return require(name);
    throw new Error('Unexpected dependency: ' + name);
  }, module, module.exports);
  return module.exports;
}
function harness() {
  const env = { STRIPE_SECRET_KEY: 'sk_test', RAZORPAY_WEBHOOK_SECRET: 'test-webhook-key', SITE_URL: 'https://test.invalid', ENCRYPTION_KEY: 'a'.repeat(64) };
  const security = load('backend/src/core/security.ts', { jsonwebtoken: {}, '../config': { env } });
  const attempts = [], calls = [], payments = [], invoices = [];
  const currentSubscription = { id: 'local-1', userId: 'user-1', status: 'TRIALING', trialEndsAt: new Date(Date.now() + 604800000) };
  const state = { calls, attempts, payments, invoices, currentSubscription, providerCalls: 0, providerError: null, completeBeforeResponse: false, missingPrice: false, remoteStatus: 'active', remoteReads: 0, outbox: [], createdSubscriptions: [], remoteRefundStatus: 'processed', audit: [], refundRow: { id: 'refund-1', paymentId: 'payment-1', providerRefundId: 'rf_test', status: 'PROCESSING', amountMinor: 600, payment: { provider:'razorpay', amountMinor: 1000, refundedMinor: 0, currency: 'INR' } } };
  function matches(item, where) {
    return Object.entries(where).every(([key, value]) => {
      if (key === 'expiresAt') return item.expiresAt <= value.lte;
      if (value && typeof value === 'object' && value.in) return value.in.includes(item[key]);
      return item[key] === value;
    });
  }
  const db = {
    checkoutAttempt: {
      findUnique: async ({ where }) => attempts.find(a => a.userId === where.userId_idempotencyKey.userId && a.idempotencyKey === where.userId_idempotencyKey.idempotencyKey) ?? null,
      findFirst: async ({ where }) => attempts.find(a => matches(a, where)) ?? null,
      create: async ({ data }) => { const a = { ...data, id: 'attempt-' + attempts.length, status: 'PROCESSING' }; attempts.push(a); return a; },
      update: async ({ where, data }) => { const a = attempts.find(a => a.id === where.id); assert.ok(a); Object.assign(a, data); return a; },
      updateMany: async ({ where, data }) => { const selected = attempts.filter(a => matches(a, where)); selected.forEach(a => Object.assign(a, data)); return { count: selected.length }; },
    },
    pricingPlan: { findUnique: async () => ({ stripeMonthlyPriceId: state.missingPrice ? null : 'price_test' }) },
    subscription: {
      findFirst: async () => ({ ...currentSubscription }),
      findUnique: async () => ({ ...currentSubscription }),
      create: async ({ data }) => { const created = { id: 'local-renewal', ...data }; state.createdSubscriptions.push(created); return created; },
      update: async ({ data }) => { Object.assign(currentSubscription, data); return { ...currentSubscription }; },
      updateMany: async ({ where, data }) => { if (matches(currentSubscription, where)) { Object.assign(currentSubscription, data); return { count: 1 }; } return { count: 0 }; },
    },
    webhookEvent: { findUnique: async () => null, create: async () => ({ id: 'event-record' }), update: async () => ({}) },
    payment: { upsert: async args => { calls.push(['payment.upsert', args]); return { id: 'payment-1', ...args.create }; }, update: async ({ data }) => { state.refundRow.payment.refundedMinor += data.refundedMinor.increment; } },
    refund: { findUnique: async () => ({ ...state.refundRow }), update: async ({ data }) => { Object.assign(state.refundRow, data); return { ...state.refundRow }; } },
    auditLog: { create: async args => { state.audit.push(args); return {}; } },
    invoice: { upsert: async args => { invoices.push(args); return {}; } },
    brandProfile: { findUnique: async () => null },
    user: { findUniqueOrThrow: async () => ({ name: 'Test Brand', email: 'test@example.com' }) },
  };
  class Stripe {
    checkout = { sessions: { create: async params => {
      state.checkoutParams = params;
      state.providerCalls++;
      if (state.providerError) throw state.providerError;
      if (state.completeBeforeResponse) attempts[0].status = 'COMPLETED';
      return { id: 'cs_test', url: 'https://checkout.stripe.test/session' };
    } } };
  }
  const refunds = load('backend/src/modules/payments/refunds.ts', { '../../core/db': { db, transaction: fn => fn(db) }, '../../core/http': { assert: ensure }, './service': {} });
  const service = load('backend/src/modules/payments/service.ts', {
    stripe: Stripe,
    '@prisma/client': { Prisma: { PrismaClientKnownRequestError: class extends Error {} } },
    '../../core/db': { db, transaction: fn => fn(db), outbox: async (_tx, type, payload) => state.outbox.push({ type, payload }) },
    '../../core/http': { assert: ensure, AppError }, '../../config': { env }, '../../core/security': security,
    './refunds': { reconcileRefund: refunds.reconcileRefund }, '../campaigns/service': { creatorFor: async () => ({}) },
  });
  const read = async (_provider, id) => { state.remoteReads++; return { id, status: state.remoteStatus, current_end: Math.floor(Date.now() / 1000) + 2592000, ...state.remoteOverrides }; };
  const readRefund = async (provider, id) => ({ id, status: state.remoteRefundStatus, amount: 600, currency: 'INR', [provider === 'stripe' ? 'metadata' : 'notes']: { trendhiveRefundId: 'refund-1' }, ...state.remoteRefundOverrides });
  const originalWebhook = service.processWebhook;
  service.processWebhook = (provider, body, signature, eventId) => originalWebhook(provider, body, signature, eventId, read, readRefund);
  return { service, state, security, env, db, read, readRefund };
}
const user = { id: 'user-1', role: 'BRAND' };
const input = { provider: 'stripe', billing: 'monthly', plan: 'SELF_SERVICE' };

test('HTTP log paths omit secret query strings and control characters', () => {
  const { security } = harness();
  assert.equal(security.requestLogPath('/api/v1/auth/google/callback?code=SECRET&state=SECRET'), '/api/v1/auth/google/callback');
  assert.equal(security.requestLogPath('/api/v1/bookings\r\n?token=SECRET'), '/api/v1/bookings');
  assert.equal(security.requestLogPath(undefined), '');
});

test('checkout retries return the saved response without another provider call', async () => {
  const { service, state } = harness();
  const first = await service.checkout(user, input, 'same-key');
  assert.deepEqual(await service.checkout(user, input, 'same-key'), first);
  assert.equal(state.providerCalls, 1);
});
test('expired local checkout requires reconciliation instead of creating a second subscription', async () => {
  const { service, state } = harness();
  await service.checkout(user, input, 'first-key');
  state.attempts[0].expiresAt = new Date(0);
  await assert.rejects(service.checkout(user, input, 'first-key'), { code: 'CHECKOUT_PENDING' });
  await assert.rejects(service.checkout(user, input, 'new-key'), { code: 'CHECKOUT_PENDING' });
  assert.equal(state.attempts[0].status, 'RECONCILE_REQUIRED');
  assert.equal(state.providerCalls, 1);
});
test('provider completion before checkout returns cannot be overwritten as pending', async () => {
  const { service, state } = harness(); state.completeBeforeResponse = true;
  const first = await service.checkout(user, input, 'race-key');
  assert.equal(state.attempts[0].status, 'COMPLETED');
  assert.deepEqual(await service.checkout(user, input, 'race-key'), first);
  assert.equal(state.providerCalls, 1);
});
test('uncertain provider error blocks another checkout; missing price fails definitely', async () => {
  const { service, state } = harness(); state.providerError = new Error('network timeout');
  await assert.rejects(service.checkout(user, input, 'timeout-key'), /network timeout/);
  assert.equal(state.attempts[0].status, 'RECONCILE_REQUIRED');
  await assert.rejects(service.checkout(user, input, 'new-key'), { code: 'CHECKOUT_PENDING' });
  const other = harness(); other.state.missingPrice = true;
  await assert.rejects(other.service.checkout(user, input, 'price-key'), { code: 'PRICE_UNAVAILABLE' });
  assert.equal(other.state.attempts[0].status, 'FAILED');
  assert.equal(other.state.providerCalls, 0);
});
test('reusing a checkout key with a different request is rejected', async () => {
  const { service, state } = harness(); await service.checkout(user, input, 'conflict-key');
  await assert.rejects(service.checkout(user, { ...input, billing: 'annual' }, 'conflict-key'), { code: 'IDEMPOTENCY_CONFLICT' });
  assert.equal(state.providerCalls, 1);
});
test('linked trial, delinquent, expired or still-paid subscriptions cannot create another provider subscription', async () => {
  for (const status of ['TRIALING', 'PAST_DUE', 'EXPIRED', 'CANCELLED']) {
    const { service, state } = harness();
    Object.assign(state.currentSubscription, { status, providerSubId: 'existing-provider-sub', currentPeriodEnd: new Date(Date.now() + 86400000) });
    await assert.rejects(service.checkout(user, input, 'new-checkout'), { code: 'ALREADY_SUBSCRIBED' });
    assert.equal(state.providerCalls, 0);
  }
});
test('distinct charged events preserve an existing refunded payment', async () => {
  const { service, state, env } = harness();
  const body = Buffer.from(JSON.stringify({ event: 'subscription.charged', payload: { subscription: { entity: { id: 'sub_test' } }, payment: { entity: { id: 'pay_test', amount: 1000, currency: 'INR' } } } }));
  const signature = crypto.createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET).update(body).digest('hex');
  await service.processWebhook('razorpay', body, signature, 'evt_test');
  const update = state.calls.find(c => c[0] === 'payment.upsert')[1].update;
  assert.equal(update.status, undefined);
  assert.equal(Object.assign({ status: 'REFUNDED' }, update).status, 'REFUNDED');
  await assert.rejects(service.processWebhook('razorpay', body, 'invalid', 'evt_bad'), { code: 'INVALID_SIGNATURE' });
});

async function razorEvent(h, event, payment = false) {
  const body = Buffer.from(JSON.stringify({ event, payload: { subscription: { entity: { id: 'sub_test', status: 'stale-event-snapshot' } }, ...(payment ? { payment: { entity: { id: 'pay_history', amount: 1000, currency: 'INR' } } } : {}) } }));
  const signature = crypto.createHmac('sha256', h.env.RAZORPAY_WEBHOOK_SECRET).update(body).digest('hex');
  return h.service.processWebhook('razorpay', body, signature, 'event-' + event);
}
test('delayed activated/cancelled events use current provider state in both directions', async () => {
  const h = harness(); h.state.remoteStatus = 'cancelled';
  await razorEvent(h, 'subscription.activated'); assert.equal(h.state.currentSubscription.status, 'CANCELLED');
  h.state.remoteStatus = 'active';
  await razorEvent(h, 'subscription.cancelled'); assert.equal(h.state.currentSubscription.status, 'ACTIVE');
  assert.equal(h.state.remoteReads, 2);
});
test('historical charge is recorded without reviving a cancelled subscription', async () => {
  const h = harness(); h.state.remoteStatus = 'cancelled';
  await razorEvent(h, 'subscription.charged', true);
  assert.equal(h.state.currentSubscription.status, 'CANCELLED'); assert.equal(h.state.calls.filter(c => c[0] === 'payment.upsert').length, 1);
});
test('stale failure event does not send dunning after provider recovery', async () => {
  const h = harness(); h.state.remoteStatus = 'active'; await razorEvent(h, 'subscription.pending'); assert.equal(h.state.outbox.length, 0);
  h.state.remoteStatus = 'halted'; await razorEvent(h, 'subscription.halted'); assert.equal(h.state.currentSubscription.status, 'PAST_DUE'); assert.equal(h.state.outbox.length, 2);
});
test('Stripe canonical cancellation and trial end are retained', async () => {
  const h = harness(), period = Math.floor(Date.now() / 1000) + 86400;
  h.state.remoteOverrides = { cancel_at_period_end: true, current_period_end: period };
  await h.service.reconcileSubscription(h.db, { ...h.state.currentSubscription }, 'stripe', 'sub_test', h.read);
  assert.equal(h.state.currentSubscription.status, 'CANCELLED'); assert.equal(h.state.currentSubscription.currentPeriodEnd.getTime(), period * 1000);
  h.state.remoteStatus = 'trialing'; h.state.remoteOverrides = { trial_end: period + 86400 };
  await h.service.reconcileSubscription(h.db, { ...h.state.currentSubscription }, 'stripe', 'sub_test', h.read);
  assert.equal(h.state.currentSubscription.trialEndsAt.getTime(), (period + 86400) * 1000);
});
test('provider binding/owner/status mismatches fail before changing local state', async () => {
  for (const remoteOverrides of [{ id: 'wrong-sub' }, { metadata: { userId: 'another-user' } }, { metadata: { subscriptionId: 'another-local-row' } }, { status: 'unsupported-status' }, {status:'toString'}]) {
    const h = harness(); h.state.remoteOverrides = remoteOverrides;
    await assert.rejects(h.service.reconcileSubscription(h.db, { ...h.state.currentSubscription }, 'stripe', 'sub_test', h.read));
    assert.equal(h.state.currentSubscription.status, 'TRIALING');
  }
  const h = harness();
  await assert.rejects(h.service.reconcileSubscription(h.db, { ...h.state.currentSubscription, providerSubId: 'old-provider-sub' }, 'stripe', 'sub_test', h.read), { code: 'SUBSCRIPTION_BINDING_MISMATCH' });
  assert.equal(h.state.remoteReads, 0);
});
test('provider read failure does not change local entitlement', async () => {
  const h = harness();
  await assert.rejects(h.service.reconcileSubscription(h.db, { ...h.state.currentSubscription }, 'stripe', 'sub_test', async () => { throw new Error('provider unavailable'); }), /provider unavailable/);
  assert.equal(h.state.currentSubscription.status, 'TRIALING');
});
test('renewal after ended cancellation preserves historical binding and does not restart trial', async () => {
  const h = harness(); Object.assign(h.state.currentSubscription, { status: 'CANCELLED', providerSubId: 'historical-sub', currentPeriodEnd: new Date(0) });
  await h.service.checkout(user, input, 'renewal-key');
  assert.equal(h.state.createdSubscriptions.length, 1); assert.equal(h.state.checkoutParams.metadata.subscriptionId, 'local-renewal');
  assert.equal(h.state.currentSubscription.providerSubId, 'historical-sub'); assert.equal(h.state.checkoutParams.subscription_data.trial_end, undefined);
});

async function refundEvent(h, event, status) {
  const body = Buffer.from(JSON.stringify({ event, payload: { refund: { entity: { id: 'rf_test', status, notes: { trendhiveRefundId: 'refund-1' } } } } }));
  const signature = crypto.createHmac('sha256', h.env.RAZORPAY_WEBHOOK_SECRET).update(body).digest('hex');
  return h.service.processWebhook('razorpay', body, signature, 'event-' + event);
}
test('delayed refund failure uses current processed state and credits refund accounting once', async () => {
  const h = harness(); h.state.remoteRefundStatus = 'processed';
  await refundEvent(h, 'refund.failed', 'failed');
  assert.equal(h.state.refundRow.status, 'SUCCEEDED'); assert.equal(h.state.refundRow.payment.refundedMinor, 600);
  await refundEvent(h, 'refund.processed', 'processed'); assert.equal(h.state.refundRow.payment.refundedMinor, 600);
});
test('delayed pending refund cannot reopen a currently failed refund reservation', async () => {
  const h = harness(); h.state.remoteRefundStatus = 'failed';
  await refundEvent(h, 'refund.created', 'pending');
  assert.equal(h.state.refundRow.status, 'FAILED'); assert.equal(h.state.refundRow.payment.refundedMinor, 0);
});
test('canonical refund rejects mismatched identity, amount, currency and unsupported status', async () => {
  for (const remoteRefundOverrides of [{ id: 'other-refund' }, { notes: { trendhiveRefundId: 'other-request' } }, { amount: 700 }, { currency: 'USD' }, { status: 'unrecognized' }]) {
    const h = harness(); h.state.remoteRefundOverrides = remoteRefundOverrides;
    await assert.rejects(refundEvent(h, 'refund.processed', 'processed'));
    assert.equal(h.state.refundRow.status, 'PROCESSING'); assert.equal(h.state.refundRow.payment.refundedMinor, 0);
  }
});
test('uncorrelated dashboard refunds create an audit task without inventing ledger entries', async () => {
  const h = harness(); await h.service.reconcileRefundEvent(h.db, 'razorpay', { id: 'dashboard-refund', notes: {} }, async () => { throw new Error('Must not read an uncorrelated refund'); });
  assert.equal(h.state.audit[0].data.action, 'UNCORRELATED_PROVIDER_REFUND'); assert.equal(h.state.refundRow.payment.refundedMinor, 0);
});

function refundHarness({ lostClaim = false, previousAttempt = false, foundRemote = true } = {}) {
  const state = { calls: [], claimed: 0, refunded: 0 };
  const refund = { id: 'refund-1', status: previousAttempt ? 'PROCESSING' : 'REQUESTED', amountMinor: 600, attemptedAt: previousAttempt ? new Date() : null, reason: 'test', paymentId: 'payment-1', payment: { id: 'payment-1', provider: 'razorpay', providerPaymentId: 'razorpay:pay-1', amountMinor: 1000, refundedMinor: 0 } };
  const db = {
    refund: {
      findUnique: async () => refund,
      updateMany: async ({ where, data }) => { assert.equal(where.attemptedAt, null); assert.equal(where.status, 'REQUESTED'); if (lostClaim) return { count: 0 }; state.claimed++; Object.assign(refund, data); return { count: 1 }; },
      update: async ({ data }) => { Object.assign(refund, data); return refund; },
    },
    payment: { update: async ({ data }) => { state.refunded += data.refundedMinor.increment; } },
  };
  const service = load('backend/src/modules/payments/refunds.ts', {
    '../../core/db': { db, transaction: fn => fn(db) }, '../../core/http': { assert: ensure },
    './service': { stripe: () => { throw new Error('Unexpected Stripe call'); }, razorpay: async (url, method) => { state.calls.push({ url, method }); return method === 'GET' ? { items: foundRemote ? [{ id: 'remote-refund', status: 'processed', notes: { trendhiveRefundId: refund.id } }] : [] } : { id: 'remote-refund', status: 'processed' }; } },
  });
  return { service, state };
}
test('a lost first-refund claim cannot make a provider POST', async () => {
  const { service, state } = refundHarness({ lostClaim: true });
  await assert.rejects(service.processRefund('refund-1'), { code: 'REFUND_RECONCILIATION_REQUIRED' });
  assert.equal(state.calls.length, 0); assert.equal(state.refunded, 0);
});
test('a claimed refund posts once and reconciles the confirmed amount', async () => {
  const { service, state } = refundHarness(); await service.processRefund('refund-1');
  assert.equal(state.claimed, 1); assert.equal(state.calls.filter(c => c.method === 'POST').length, 1); assert.equal(state.refunded, 600);
  await service.processRefund('refund-1'); assert.equal(state.calls.length, 1);
});
test('retry after a prior refund attempt only reconciles an existing remote refund', async () => {
  const { service, state } = refundHarness({ previousAttempt: true }); await service.processRefund('refund-1');
  assert.equal(state.calls.length, 1); assert.equal(state.calls[0].method, 'GET'); assert.equal(state.refunded, 600);
});
test('uncertain prior refund without remote proof cannot be posted again', async () => {
  const { service, state } = refundHarness({ previousAttempt: true, foundRemote: false });
  await assert.rejects(service.processRefund('refund-1'), { code: 'REFUND_RECONCILIATION_REQUIRED' });
  assert.equal(state.calls.some(c => c.method === 'POST'), false); assert.equal(state.refunded, 0);
});

test('signed malformed Razorpay JSON and null payloads return controlled validation errors',async()=>{const h=harness();for(const raw of ['{','null','[]','{"event":123,"payload":{}}']){const body=Buffer.from(raw),sig=crypto.createHmac('sha256',h.env.RAZORPAY_WEBHOOK_SECRET).update(body).digest('hex');await assert.rejects(h.service.processWebhook('razorpay',body,sig,'malformed'),{code:'INVALID_WEBHOOK'});}});
