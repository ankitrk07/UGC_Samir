# TRENDHIVE by onetrendsetter

The existing Next.js frontend is in `frontend/`; the Express API, worker, Prisma migrations and tests are in `backend/`. The active workflow does not require Docker.

## Start without containers

1. Complete the manual npm workspace installation and retain its root lockfile.
2. Run `npm.cmd run setup:local` to create missing private settings without replacing existing files.
3. Configure native or managed development PostgreSQL/Redis in backend/.env. Configure SMTP for verification/reset/booking email.
4. Generate/validate Prisma Client, pass backend typecheck and apply development migrations.
5. Run `npm.cmd run check:services` for authenticated SQL/Redis checks and proxy validation.
6. Run `npm.cmd run dev:all` to start the API, worker and frontend together after preflight.

Root `npm.cmd run dev` still starts only the frontend. Separate API/worker commands are `npm.cmd run dev:api` and `npm.cmd run dev:worker`. Combined startup waits for API readiness, checks occupied ports and stops its owned process trees on exit/Ctrl+C.

Frontend: http://localhost:3000. API: http://localhost:4000. Swagger: http://localhost:4000/docs. Native Mailpit optionally uses SMTP 1025 and web UI 8025.

Read [Windows startup](docs/WINDOWS-STARTUP.md) and [native/managed deployment](docs/DEPLOYMENT.md). Old container files are unused legacy alternatives; no current startup command invokes them.

## Contracts and verification

- [API contract](docs/API-CONTRACT.md), [OpenAPI](backend/openapi.json), [Postman](backend/postman/TRENDHIVE.postman_collection.json)
- [Actual verification](docs/VERIFICATION.md), [coverage](docs/COVERAGE.md), [operation checklist](docs/API-OPERATION-VERIFICATION.md)
- [Schema audit](docs/SCHEMA-AUDIT.md), [migration recovery](docs/MIGRATION-RECOVERY.md), [payment reconciliation](docs/PAYMENT-RECONCILIATION.md), [manual payouts](docs/PAYOUT-OPERATIONS.md)

The service checker requires authenticated SELECT 1 and migration history, Redis PING/INFO/Lua and a matching proxy. SMTP TCP reachability does not certify delivery. Integration/coverage tests need an isolated database ending in _test and Redis DB 15; they can delete test data. Never use production connections.

Optional `npm.cmd run db:seed -w backend` inserts explicit development fixtures, never a fallback for unavailable live data.

**NOT PRODUCTION READY.** Missing backend packages/services, migrations, service coverage and provider/deployment acceptance remain blockers. No Docker command or dependency installation was executed during the current pass.
