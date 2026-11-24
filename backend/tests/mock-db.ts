export const table = () => ({ findFirst: jest.fn(), findUnique: jest.fn(), findUniqueOrThrow: jest.fn(), findMany: jest.fn(), count: jest.fn(), create: jest.fn(), createMany: jest.fn(), update: jest.fn(), updateMany: jest.fn(), upsert: jest.fn(), aggregate: jest.fn(), groupBy: jest.fn(), deleteMany: jest.fn() });
export const mockDb = { checkoutAttempt: table(), teamMember: table(), user: table(), refreshToken: table(), brandProfile: table(), creatorProfile: table(), emailVerificationToken: table(), passwordResetToken: table(), oAuthAccount: table(), subscription: table(), auditLog: table(), outboxEvent: table(), campaign: table(), application: table(), post: table(), wallet: table(), ledgerEntry: table(), payout: table(), pricingPlan: table(), payment: table(), invoice: table(), webhookEvent: table(), refund: table(), revenueEvent: table(), analyticsDaily: table(), conversationParticipant: table(), message: table(), mediaAsset: table(), conversation: table(), notification: table() };
export const mockRedis = { get: jest.fn(), getdel: jest.fn(), set: jest.fn(), publish: jest.fn() };
export function resetDb() { for (const t of Object.values(mockDb)) {
    for (const f of Object.values(t))
        f.mockReset();
    t.findMany.mockResolvedValue([]);
    t.count.mockResolvedValue(0);
    t.aggregate.mockResolvedValue({ _sum: { rewardMinor: 0, amountMinor: 0 } });
    t.create.mockImplementation(async (input: {
        data: Record<string, unknown>;
    }) => ({ id: 'created-id', ...input.data }));
    t.update.mockImplementation(async (input: {
        data: Record<string, unknown>;
    }) => ({ id: 'updated-id', ...input.data }));
    t.upsert.mockImplementation(async (input: {
        create: Record<string, unknown>;
    }) => ({ id: 'upserted-id', ...input.create }));
} for (const fn of Object.values(mockRedis))
    fn.mockReset(); }
export function testUser(role: 'BRAND' | 'CREATOR' | 'ADMIN' | 'SUPERADMIN' = 'BRAND') { return { id: 'user-1', email: 'user@test.local', name: 'User', role, passwordHash: 'hash:ValidPassword123', emailVerifiedAt: new Date(), bannedAt: null, failedLogins: 0, lockedUntil: null, preferences: {}, termsAcceptedAt: null, termsVersion: null, createdAt: new Date(), updatedAt: new Date(), deletedAt: null }; }
