# Migration and recovery verification

Status: NOT RUN. PostgreSQL and Prisma CLI are unavailable in the verification environment. No SQL was executed, no database was rolled back and no backup restore was verified.

The initial migration includes 43 tables plus custom checks, partial unique indexes, the availability exclusion constraint and a deferred balanced-ledger trigger. Model/table name matching does not validate these SQL constructs.

## Required test rehearsal

Use a disposable *_test database and a separately retained pre-migration backup. After installing the pinned Prisma 6.19 toolchain:

1. Run Prisma validate, generate the client, then migrate deploy against the isolated test database. Inspect migrate status and _prisma_migrations for successful completion.
2. Run migrate deploy again and confirm no pending changes or duplicated objects.
3. Inspect real foreign keys, enum values, indexes, checks, the booking exclusion/active-booking uniqueness constraints and deferred ledger trigger. Test rejection of negative wallets, over-refunds, overlapping availability, duplicate active bookings and unbalanced ledger entries at COMMIT.
4. Test ledger INSERT, UPDATE, transactionId changes and DELETE, including multi-row transactions. The trigger source now checks both previous and new transaction IDs. This change is not SQL-executed or database-verified; do not infer correctness from the INSERT-only application tests.
5. On a second disposable database, rehearse an interrupted/failed migration and record exactly which statements applied. The migration is not supplied with a tested down script.
6. Restore the pre-migration backup to another isolated database. Compare schema, data counts and financial balances, then reapply the release and rerun integration tests. Record commands, timing and results.

Prisma distinguishes migration-history repair from undoing SQL. [The official recovery guide](https://www.prisma.io/docs/orm/prisma-migrate/workflows/patching-and-hotfixing) explains that migrate resolve --rolled-back marks a failed migration for retry; partially applied SQL may need explicit repair. It does not reverse applied statements.

[The down-migration guide](https://www.prisma.io/docs/orm/prisma-migrate/workflows/generating-down-migrations) explains that custom SQL such as triggers must be handled manually in a reversal. Verify CLI flags against the pinned Prisma 6 version; do not copy version-7 command examples blindly.

For a successfully applied migration, use a reviewed forward corrective migration or a rehearsed backup/PITR recovery plan. Do not reset a production database. This repository does not currently have a verified rollback guarantee.

There are now two ordered migrations. 20261113000000_user_integrity adds the Payment/User and TeamMember/User FKs and reverse membership index in an explicit transaction. No SQL has been executed for this migration. An orphan row causes failure for explicit repair; no migration deletes financial/team data to force success. Rehearse its rollback/failure recovery on an isolated database. Do not change an already-applied migration to bypass a checksum error.
