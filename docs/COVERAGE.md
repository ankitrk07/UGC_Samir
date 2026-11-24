## Actual Jest report (2026-11-24)

Executed npm.cmd run test:unit -w backend -- --coverage: **64 tests in 9 suites passed**, but the command exited 1 because the unchanged branch coverage threshold was not met.

| Scope | Lines | Statements | Functions | Branches |
| --- | ---: | ---: | ---: | ---: |
| Configured service/core scope | 80.43% | 78.51% | 79.06% | 59.53% |
| Module service/refund/revenue files only | 79.58% (417/524) | 77.32% (457/591) | 76.71% (56/73) | 59.22% (276/466) |

Reports: backend/coverage/coverage-summary.json, backend/coverage/lcov.info. Aggregation uses actual covered/total counts, not averages of file percentages. Unit tests use I/O doubles; no database/Redis/provider acceptance coverage is claimed. Earlier NOT MEASURED statements below are historical. No important code was excluded and no threshold was lowered.

Additionally, the independent offline suite passed 83/83 tests. These do not add to Jest coverage.

## 2026-11-24 update

Combined offline suite: **83 passed, 0 failed/skipped**. Added blank/partial SMTP configuration checks and paused-email dispatcher cases. These tests use dependency doubles; service-layer instrumented coverage remains **NOT MEASURED**. No 70% coverage claim.

# Coverage and release status

Current non-Docker pass (2026-11-23): **79 offline tests pass**, and frontend typecheck passes. New checker/supervisor cases use I/O doubles. Actual SQL, Redis, queue execution and successful combined startup are not verified; the launcher correctly aborts before spawning services when preflight fails. Native/managed services replace the container prerequisite. Service-layer coverage remains **NOT MEASURED**; the 70% Jest thresholds are unchanged. The earlier baseline below is historical.

Current pass (2026-11-15): **NOT PRODUCTION READY**. 65 executable offline checks pass, and frontend strict typecheck/production build pass. Service-layer coverage remains **NOT MEASURED**. The 139-route access/validation sweep plus 2 unsigned-webhook tests is implemented but has not executed; no successful backend operation is certified. See VERIFICATION.md and WINDOWS-STARTUP.md.

This checklist distinguishes implemented source, frontend wiring and executed verification. A checked endpoint means code and a contract exist, not that the database/provider acceptance test has passed.

## Original frontend coverage

| Form / section | Endpoint implemented | Frontend connected | Verification |
| --- | --- | --- | --- |
| Signup, login, forgot/reset | Yes | Yes, secure Next bridge | Frontend build/input contract checks; backend Jest pending |
| Google login and terms | Yes | Yes, bound callback and completion page | Source checked; Google credentials pending |
| Email verification | Yes | Yes, token-action page | Provider delivery pending |
| Brand onboarding draft/final | Yes | Yes | Zod contract checks pass |
| Campaign creation/list/detail/search/filter | Yes | Yes | Original DTO contract preserved; DB tests pending |
| Creator directory/detail/search | Yes | Yes | Original DTO contract preserved |
| Dashboard Views / Engagement / ROI | Yes | Yes | Frontend type/build checks; DB aggregation tests pending |
| CSV/PDF export | Yes | Yes | Download bridge implemented; backend execution pending |
| Notifications and logout | Yes | Yes | Cookie-policy tests pass; DB execution pending |
| Creator application lead form | Yes | Yes | Input contracts pass |
| Contact form | Yes | Yes | Input contracts pass |
| Newsletter opt-in/confirm/unsubscribe | Yes | Yes | Token routes present; SMTP acceptance pending |
| Booking availability/create | Yes | Yes, no fake-slot fallback | Input contracts pass; DB race test pending |
| Booking reschedule/cancel | Yes | Added management page | DB/SMTP acceptance pending |
| Pricing monthly/annual, FAQ | Yes | Yes | Public context integration |
| Testimonials, showcase photos/videos/logos | Yes | Yes | Asset IDs match original; upload provider pending |
| Site stats, country list, sitemap | Yes | Stats/sitemap connected; original country selectors retained | Source contract checks |
| Explicit dashboard demo | Intentionally local | Yes | Preserves demo behavior |
| Local UI controls | No server needed | Local theme/menu/password/accordion/carousel/video controls | Original behavior retained |

No original server-backed form was intentionally omitted. Countries endpoint exists; original country-selector options remain local for immediate form rendering. Cookie consent has an endpoint but the original frontend contains no consent widget. There are no complete new frontend screens for the backend-only modules below.

## Requested backend modules

- [x] Auth: password/OAuth, lockout, verification/reset, refresh rotation/reuse detection, revoke one/all, me, password change.
- [x] Brands/creators: onboarding/profile, team invites, encrypted payout details, portfolio and bio verification.
- [x] Campaigns: ownership, marketplace, filters, cursor/offset, duplicate/jobs/deliverables, applications, review/shortlist/withdraw.
- [x] Content: submission, reasons/revisions, approval, one reward credit per accepted application.
- [x] Analytics: scoped range/currency/platform/country aggregates, latest top posts, leaderboard, ROI revenue ingestion, CSV/PDF, cache.
- [x] Social: adapters, development mock, queue retries/rate-limit handling, snapshots/daily metrics.
- [x] Billing: trial, Stripe/Razorpay checkout and signed idempotent webhooks, plan/cancel/portal, invoices, queued refunds, dunning notices.
- [x] Payout accounting: reserve/approve/process/manual settlement/failure, balanced ledger and concurrency constraints.
- [x] Chat/notifications: participant checks, history/unread/read cursors, Socket.IO rooms/presence/typing, Redis cross-instance delivery, clean attachments and preferences.
- [x] Public: contact, newsletter opt-in/unsubscribe, leads/UTM, pricing/FAQ/testimonials/media/stats/countries/sitemap.
- [x] Booking: explicit UTC availability, IANA conversion, overlap/double-booking prevention, manage tokens, email reminders and calendar attachment.
- [x] Media: signed quarantine upload, bounds/type inspection, scanner hook, ffprobe/thumbnail generation, clean asset promotion, admin replacements.
- [x] Admin: users/ban/read-only audited impersonation, verification/moderation/oversight, payouts/leads/calls/site CMS, metrics/audit/read-only queue dashboard.
- [x] Compliance primitives: cookie/terms records, personal-data export, reauthentication/anonymization/session revocation and queued media purge.
- [x] Operations artifacts: schema/SQL migration/seed, env, Docker/Compose, OpenAPI/Postman/types, Jest suites, CI and deployment/integration guides.

## Incomplete capabilities and unverified requirements

1. Backend dependencies are still absent; the user is handling manual installation. The agent did not attempt npm install in the current pass. Strict backend compile, ESLint, Prisma validation, migration execution, Jest/Supertest execution, dependency audit, Docker startup and real service coverage are pending. The 70% gate is configured; there is no measured 70% result.
2. No automated bank/UPI/PayPal transfer provider is implemented. Payout settlement is an admin-confirmed manual flow.
3. Optional web push and automated social-provider OAuth token renewal are not implemented. Live adapters require manually provisioned valid credentials and approved permissions.
4. Full Service plan is sales-led; the code does not invent a fixed price. No automatic provider-specific recovery schedule beyond provider retries plus email notification has been certified.
5. GST/tax fields and invoice rendering exist; seller registration, tax calculation and legally approved invoice formatting remain business work.
6. The code uses route modules containing validation/controllers, business services and shared Prisma transactions rather than artificial empty controller/repository/event/job files in every module. Some secondary OpenAPI responses are generic and need narrower DTO schemas before client generation for those screens.
7. Availability administration creates explicit slots; no recurring weekly calendar UI or external conferencing/calendar provider synchronization is implemented.
8. Seed/live adapters are not guaranteed to reproduce every original mock aggregate: seeded asset URLs/DTOs match, while live metrics are computed from actual stored facts. Reach/ROI cannot be inferred reliably when a provider or attribution feed supplies none.
9. GDPR/DPDP operational compliance, CDN invalidation, backup retention, payment reconciliation and provider acceptance require staging/operational validation. No certification is claimed.

See PHASES.md for phase-by-phase implementation and verification status, and VERIFICATION.md for checks executed in this workspace.

## Current verification scope

Offline checks exercise actual transpiled source with I/O doubles for checkout/refund claims, socket lifecycle and worker dispatch. They are not real database/provider/queue acceptance and are not counted toward the Jest 70% service gate. The new api-access.test.ts executes negative guest/role/validation HTTP checks for every registered route when an isolated database and Redis are available. Its generated api-access-validation.json does not certify happy paths, ownership, pagination or sandbox payments. All 141 live operation rows remain open in API-OPERATION-VERIFICATION.md.

The source audit covers all 43 models and both migrations; it detects scalar-column/nullability/named-FK mismatches only. Prisma semantics, SQL constraints and runtime transaction behavior remain pending.

Real frontend checks now also pass: 24 desktop/mobile browser cases on the existing Edge binary and 8 HTTP boundary checks against production Next. Neither contributes to the service-layer percentage or backend-operation acceptance. External image delivery and full visual/animation fidelity under production networking remain unverified.

2026-11-15: 24 isolated payment regressions pass as part of 65 offline tests. Canonical provider readers and refund reconciliation are exercised with I/O doubles; the new code has not been measured by Jest coverage or sandbox tests. The prior 24 browser/8 HTTP checks were executed on 2026-11-13 and have not been rerun for this backend-only continuation.
