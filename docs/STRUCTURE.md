# Folder structure

```text
trendhive/
  frontend/
    src/app/                Next pages, API bridge and OAuth callbacks
    src/components/         Connected forms/dashboard/public UI
    src/lib/                API client, Zod, policy, fixtures, generated types
    src/config/assets.ts    Original asset IDs and development URLs
    tests/
    public/
  backend/
    src/
      app.ts                Middleware and route registration
      server.ts             HTTP/socket lifecycle
      config.ts             Validated environment
      core/                 Prisma/Redis, HTTP/RBAC/CSRF, crypto
      modules/
        auth/               Account/session/OAuth service and routes
        campaigns/          Brand/creator/campaign/application/content workflows
        analytics/          Aggregation, exports, attributed revenue
        social/             Linking, provider adapters and sync jobs
        media/              Upload, scan and thumbnail jobs
        payments/           Billing, webhook, refund and payout workflows
        chat/               Messaging, sockets and notifications
        public/             Website, newsletter and booking
        admin/              Oversight, reconciliation and CMS
        compliance/         Consent, terms, export and erasure
      jobs.ts               Queue definitions
      worker.ts             Schedules, outbox and job execution
      openapi.ts            Runtime OpenAPI assembly
    prisma/schema.prisma
    prisma/migrations/
    prisma/seed.ts
    tests/unit/
    tests/integration/
    openapi.json
    postman/TRENDHIVE.postman_collection.json
    Dockerfile
    .env.example
  scripts/                  Contract, inventory and source checks
  tests/contracts.test.cjs
  docs/
  docker-compose.yml
  .github/workflows/ci.yml
```

Route files contain controllers and Zod validators; services contain business rules and transaction boundaries. Shared Prisma access lives in core/db.ts. Workflow/money mutations use serializable transactions with retry. Transactional outbox records persist job/notification intent. Provider work lives in adapters/jobs. There are no artificial empty controller/repository/event/job files in every module.
