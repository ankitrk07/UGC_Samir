## Verified compiled-backend fallback (2026-11-24)

Backend strict compilation/build now pass after Prisma generation. This tool environment could not launch tsx because os.userInfo failed; the compiled entry point ran up to its real database connection check. On a machine with native PostgreSQL/Redis running and matching private credentials:

```powershell
npm.cmd run db:generate -w backend
npm.cmd run db:migrate -w backend
npm.cmd run check:services
npm.cmd run build -w backend
npm.cmd run start -w backend
```

Use separate terminals for npm.cmd run dev:worker and npm.cmd run dev. The worker still uses tsx; worker startup is not yet live verified. A successful build does not create PostgreSQL/Redis services. Current PostgreSQL/Redis ports are unavailable. Keep SMTP blank as requested; verification email remains paused.

## Current local settings

backend/.env targets PostgreSQL on **127.0.0.1:5432**, database **trendhive**. Credentials remain private and must match your native PostgreSQL role. This configuration does not install PostgreSQL or create a database. Redis is still required for sessions, queues and rate limiting. No Docker is needed.

SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD and EMAIL_FROM are intentionally blank. No Mailpit or SMTP service is required for local startup. Email verification remains required; signup cannot complete verified login until email delivery is configured. Configure host, port and sender together later, restart API/worker, and request a fresh verification link.

# Windows startup without Docker

Run from C:\Users\Eternity\Downloads\trendhive. No container runtime is needed. Dependencies remain the user's manual installation step; project startup scripts never install missing packages.

## 1. Native services or managed development services

- Install PostgreSQL 16 from the [official Windows page](https://www.postgresql.org/download/windows/), including psql/pgAdmin.
- Run a Redis-compatible Windows service supporting Redis 6.2+ commands (Redis 7 is the target). The [official Redis Windows guide](https://redis.io/docs/latest/operate/oss_and_stack/install/archive/install-redis/install-redis-on-windows/) documents Memurai and WSL alternatives. Actual queue compatibility must be tested.
- Optionally run the native [Mailpit Windows binary](https://mailpit.axllent.org/docs/install/): SMTP 1025, inbox UI 8025. A real transactional SMTP provider also works.

Discover installed services without guessing their names:

```powershell
Get-Service | Where-Object { $_.Name -match 'postgres|redis|memurai' } | Select-Object Name, Status
```

Start the selected installed services using their exact Windows names. Service startup may need an appropriately authorized terminal. The project does not change permissions or install operating-system components.

Alternatively, use dedicated managed development PostgreSQL and Redis services. Store their credentials only in backend/.env. Redis must provide the full TCP/TLS protocol, Lua, blocking commands and Pub/Sub; a REST-only cache endpoint is insufficient. No managed resource has been provisioned by the agent.

## 2. Create native PostgreSQL development/test databases

For PostgreSQL 16 at the standard installer location:

```powershell
$psqlBinary = Join-Path $env:ProgramFiles 'PostgreSQL\16\bin\psql.exe'
if (-not (Test-Path -LiteralPath $psqlBinary)) {
    throw 'Set $psqlBinary to the psql.exe installed on this machine.'
}
& $psqlBinary -h 127.0.0.1 -p 5432 -U postgres -d postgres -W
```

Inside interactive psql, for a fresh installation:

```sql
CREATE ROLE trendhive LOGIN;
\password trendhive
CREATE DATABASE trendhive OWNER trendhive;
CREATE DATABASE trendhive_test OWNER trendhive;
\q
```

The password command prompts instead of storing a password in command history. If a role/database already exists, inspect and reuse its configuration; do not delete data to bypass an error. Managed services may provide their own precreated role/database.

## 3. Configure the project

```powershell
Set-Location C:\Users\Eternity\Downloads\trendhive
npm.cmd run setup:local
```

Edit private backend/.env with the actual development DATABASE_URL, REDIS_URL and SMTP settings. URL-encode special characters in connection passwords. Keep generated JWT_SECRET/ENCRYPTION_KEY private. Development defaults: SITE_URL=http://localhost:3000, backend API_URL=http://localhost:4000, PORT=4000.

The private frontend/.env.local API_URL must end in /api/v1, e.g. http://localhost:4000/api/v1. Backend API_URL is an origin without that path. Existing files are preserved; setup:local does not silently change custom settings.

After manually installing the workspace packages:

```powershell
npm.cmd run db:generate -w backend
npm.cmd run db:validate -w backend
npm.cmd run typecheck -w backend
npm.cmd run db:migrate -w backend
npm.cmd run db:status -w backend
npm.cmd run check:services
```

Stop on any failed command. Migrations must target the intended development database.

## 4. Start the full application

```powershell
npm.cmd run dev:all
```

This checks packages, real SQL/Redis protocols, applied migration history, proxy configuration and ports. It starts API first, waits for /ready, then starts worker/frontend. It does not install/start PostgreSQL/Redis, seed fixtures or fake API data. Ctrl+C stops its owned application processes. A failing preflight starts no partial application stack.

Separate-terminal commands remain available:

```powershell
npm.cmd run dev:api
```

```powershell
npm.cmd run dev:worker
```

```powershell
npm.cmd run dev
```

The combined launcher is for development/test payment keys. Use independently supervised compiled processes in production.

## 5. Verify actual APIs

```powershell
Invoke-RestMethod http://localhost:4000/health
Invoke-RestMethod http://localhost:4000/ready
$publicEndpoints = 'media/showcase','pricing','faq','testimonials','stats'
foreach ($endpoint in $publicEndpoints) {
    Invoke-RestMethod ('http://localhost:4000/api/v1/' + $endpoint)
    Invoke-RestMethod ('http://localhost:3000/api/backend/' + $endpoint)
}
```

An unseeded table can correctly return an empty array. A /health response alone does not verify SQL/Redis; /ready must pass. Signup additionally needs valid submission, worker email delivery, email verification and login.

## 6. Isolated verification

Create a private backend/.env.test file using the real isolated test credentials:

```dotenv
NODE_ENV=test
DATABASE_URL=postgresql://trendhive:YOUR_URL_ENCODED_TEST_PASSWORD@127.0.0.1:5432/trendhive_test
REDIS_URL=redis://127.0.0.1:6379/15
```

Replace the placeholder locally; never commit this file. Tests can truncate data and flush Redis DB 15. If a managed service only supports DB 0, use a separate compatible Redis test service; do not bypass the isolation guard.

```powershell
node --env-file=backend/.env.test scripts/verify-readiness.cjs
```

The runner migrates/runs coverage only after its test-isolation guard passes. Inspect actual reports; a source audit is not SQL execution. Coverage thresholds remain 70%.

Frontend verification is independent:

```powershell
npm.cmd run test -w frontend
npm.cmd run typecheck -w frontend
npm.cmd run build -w frontend
```

NOT PRODUCTION READY until actual API, database, provider, coverage and deployment gates pass.
