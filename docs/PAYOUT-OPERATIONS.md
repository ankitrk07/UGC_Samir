# Payout settlement operations

Status: automated provider settlement NOT IMPLEMENTED / NOT TESTED. No transfer was executed during verification.

## Provider support and missing prerequisites

Providers do support payouts. [RazorpayX payout documentation](https://razorpay.com/docs/api/x/payouts) describes a business account, contact/fund account, IP allowlisting and mandatory payout idempotency. [Stripe Connect payout documentation](https://docs.stripe.com/connect/manage-connected-account-payouts) describes connected-account balances, payout management and status webhooks.

The project's subscription checkout credentials do not establish that either payout product is enabled for this business. There is no configured RazorpayX business debit account/fund-account onboarding, Stripe connected-account onboarding or tested payout webhook reconciliation. Automation remains a production blocker under the requested acceptance criteria. Do not claim that providers lack this capability.

Before automation: confirm provider/product eligibility for the platform's countries/currencies; complete approved onboarding and destinations; add a durable external transfer identity; verify payout requests and signed lifecycle/reversal events in sandbox; test retries, timeout reconciliation, duplicate/out-of-order events and final bank reconciliation. Never retry an ambiguous transfer with a new idempotency key.

## Interim manual procedure

This procedure documents the existing code path. It is not evidence that the operational process has been executed or approved for production.

1. Creator saves bank/UPI/PayPal destination through PATCH /api/v1/creators/payout-details. Details are encrypted with AES-GCM.
2. Creator requests an integer minor-unit amount via POST /api/v1/payouts with a unique Idempotency-Key. The transaction moves available balance into reserved balance and writes balanced ledger entries.
3. Finance lists /api/v1/admin/payouts. Access to /api/v1/admin/payouts/:id/details is restricted and audited. Verify beneficiary, currency, amount, earned balance and absence of another settlement for this payout ID. Obtain a second human sign-off; the application does not enforce separate approver identities.
4. Set APPROVED through PATCH /api/v1/admin/payouts/:id. Set PROCESSING immediately before the approved operator initiates a single transfer through the bank/provider dashboard. Use the payout ID as the external reference where supported.
5. Keep PROCESSING while the transfer outcome is unknown. Inspect the provider/bank status and statement before retrying. A timeout or missing confirmation is not proof of failure.
6. After confirmed settlement, set PAID with the bank/provider reference. Store the matching amount/currency/destination evidence in restricted finance records. This consumes reserved balance and writes the settlement ledger pair.
7. Set FAILED only after confirming that no transfer settled and no pending transfer can still settle. Provide the reason. FAILED returns the reservation to available balance. REJECTED is permitted before processing and also releases reserved funds.
8. Reconcile payout IDs, references, wallet balances and ledger transactions against external statements daily. Investigate any amount/currency mismatch before further payouts.

Existing state transitions: REQUESTED -> APPROVED or REJECTED; APPROVED -> PROCESSING or REJECTED; PROCESSING -> PAID or FAILED. Terminal states cannot be edited through that API. Duplicate settlement attempts are rejected by state transitions, but the application cannot prevent a human from making two transfers outside the application.

Post-settlement bank reversals, disputes or discovered duplicate external transfers require a controlled finance incident and compensating accounting procedure. No automated payout reversal handler exists. Do not mark a second transfer as a new earned payout to conceal a reconciliation error.

## Execution status

Jest tests for ledger reservation, terminal-state logic and redaction are written but have not executed in this environment. Current offline payment tests cover checkout/refund safety, not real payout reservation or settlement. Real PostgreSQL/provider settlement and manual end-to-end reconciliation have not been executed. The manual flow is an interim fallback, not completion of automated settlement.

Current pass: no automated transfer integration was added because provider onboarding/credentials and sandbox execution are unavailable. The manual process is retained without claiming provider automation is unsupported. Never use a changed local payout status as proof that a bank transfer occurred. Tests use no real customer funds.

2026-11-15 payment follow-up: subscription/refund webhook changes now reconcile current provider state with bounded provider reads and transactional retries. Sandbox/provider/database acceptance remains pending. Renewal preserves old billing identities; uncorrelated external refunds require audited finance reconciliation. See PAYMENT-RECONCILIATION.md. Automated payout settlement is unchanged and remains manual/unverified.
