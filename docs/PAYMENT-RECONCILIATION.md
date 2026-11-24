# Payment reconciliation changes and verification

Updated 2026-11-15. Implementation and isolated regression verification only. No sandbox account, real PostgreSQL transaction, Stripe SDK exchange or money transfer was exercised. **NOT PRODUCTION READY.**

## Subscription state

The verified webhook still uses exact signed raw bytes and an atomic WebhookEvent record. Entitlement changes now read the provider's current subscription rather than trust the event's historical status. Local subscription identity/owner metadata and provider bindings must agree. Canonical reads have a five-second request timeout; failures return non-2xx and leave the database transaction/event uncommitted for retry. There is no successful fallback on provider failure.

The current provider read occurs after reading the local subscription inside the serializable transaction. Conflicting local writes must cause a database transaction retry and another provider read. This source design must still be verified using real concurrent PostgreSQL connections and provider sandbox responses.

Subscription lifecycle events, Stripe checkout completion and paid/failed invoices all use that reconciliation. Historical payment facts may still create a missing payment/invoice without reviving an ended subscription. Dunning is emitted only when current state is delinquent and the local state was not already delinquent. Stripe's scheduled cancellation and extended near-expiry trial dates are preserved from current state.

A renewal after an ended cancellation creates a new local subscription row and keeps the old provider identity on its historical row. Old invoices remain attributable and the old trial is not restarted.

## Refund state

Correlated refund events fetch the current refund first, validate the request metadata, provider refund ID, amount, currency and original provider, then reconcile accounting. Old failed/pending snapshots cannot override a currently settled/failed refund simply because they arrive late. SUCCEEDED accounting is idempotent. A first Razorpay refund POST still needs the atomic claim guard; ambiguous attempts must reconcile before any new POST.

A provider-dashboard refund without the local request metadata creates an UNCORRELATED_PROVIDER_REFUND audit entry. Finance must correlate it and check the actual provider statement; automatic ingestion of every external dashboard refund is not implemented. It does not invent a local refund ledger entry.

## Executed checks

The current payment-safety suite contains 24 passing tests. New cases cover reversed-order lifecycle snapshots, historical charges, stale failure notices, owner/binding mismatches, unsupported status values, provider read failure, renewed subscription history, current refund state versus stale events, refund amount/currency identity checks, uncorrelated-refund audit and signed malformed JSON rejection. The complete offline suite passes 65 tests.

Tests execute actual transpiled source with in-memory database/provider doubles; HMAC uses Node crypto. Test-only provider readers are injectable service arguments, never HTTP fields. No mock provider status is substituted in the production route. Existing Jest fixtures were updated to explicitly mock provider reads and remain unexecuted because Jest/Prisma are absent.

## Required before release

- Install packages and generate Prisma Client, then pass strict compilation and the existing Jest suites.
- Apply migrations; test serializable conflicts, webhook retries, atomic event rollback and repeated provider outages with real PostgreSQL.
- Exercise the actual Stripe/Razorpay SDK/REST reads and signatures in sandbox; validate request latency against provider webhook delivery budgets.
- Verify scheduled cancellation, trial changes, partial refunds, all lifecycle states and provider API-version payloads.
- Set up alerting and a controlled reconciliation process for uncorrelated refunds, exhausted jobs and failed webhooks.
- Verify real service coverage and dependency audit. Automated payouts are still absent.

## Primary references consulted

[Stripe webhook delivery and ordering](https://docs.stripe.com/webhooks), [Stripe subscription retrieval](https://docs.stripe.com/api/subscriptions/retrieve), [Stripe refund retrieval](https://docs.stripe.com/api/refunds/retrieve), [Razorpay webhook best practices](https://razorpay.com/docs/webhooks/best-practices), [Razorpay official subscription client source](https://github.com/razorpay/razorpay-node/blob/master/lib/resources/subscriptions.js), [Razorpay official refund client source](https://github.com/razorpay/razorpay-node/blob/master/lib/resources/refunds.js). These support the implementation approach; reading documentation is not provider acceptance testing.
