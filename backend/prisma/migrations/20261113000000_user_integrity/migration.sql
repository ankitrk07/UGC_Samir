-- Restrict physical deletion of users referenced by financial/team records.
-- Existing orphan records cause this migration to fail for explicit repair.
BEGIN;
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX "TeamMember_userId_deletedAt_idx" ON "TeamMember"("userId", "deletedAt");
COMMIT;
