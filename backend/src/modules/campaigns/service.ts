import { Prisma, type User, type Campaign, type Post } from '@prisma/client';
import { db, transaction, outbox } from '../../core/db';
import { assert, isAdmin } from '../../core/http';
export async function brandFor(user: User) { const brand = await db.brandProfile.findFirst({ where: { userId: user.id, deletedAt: null } }); assert(brand, 403, 'BRAND_REQUIRED', 'Complete your brand profile first.'); return brand; }
export async function creatorFor(user: User) { const creator = await db.creatorProfile.findFirst({ where: { userId: user.id, deletedAt: null } }); assert(creator, 403, 'CREATOR_REQUIRED', 'Complete your creator profile first.'); return creator; }
export function campaignDTO(c: Campaign & {
    applications?: unknown[];
    posts?: (Post & {
        snapshots?: {
            views: number;
        }[];
    })[];
    _count?: {
        applications: number;
    };
}) {
    return { id: c.id, name: c.title, category: c.niche, status: ({ LIVE: 'Live', REVIEW: 'Review', COMPLETED: 'Completed', DRAFT: 'Draft', CANCELLED: 'Cancelled' })[c.status], creators: c._count?.applications ?? c.applications?.length ?? 0, views: c.posts?.reduce((sum, p) => sum + (p.snapshots?.[0]?.views ?? 0), 0) ?? 0, budget: Number(c.budget), brief: c.brief, currency: c.currency, platforms: c.platforms, countries: c.countries, goal: c.goal, startDate: c.startDate, endDate: c.endDate };
}
export const campaignInclude = { _count: { select: { applications: { where: { status: 'ACCEPTED' as const, deletedAt: null } } } }, posts: { where: { deletedAt: null }, include: { snapshots: { orderBy: { capturedAt: 'desc' as const }, take: 1 } } } };
export async function ownCampaign(user: User, id: string) {
    const campaign = await db.campaign.findFirst({ where: { id, deletedAt: null }, include: { brand: true } });
    assert(campaign, 404, 'NOT_FOUND', 'Campaign not found.');
    const membership = isAdmin(user) || campaign.brand.userId === user.id ? true : await db.teamMember.findFirst({ where: { brandId: campaign.brandId, userId: user.id, permission: 'EDITOR', deletedAt: null } });
    assert(membership, 403, 'FORBIDDEN', 'You cannot manage this campaign.');
    return campaign;
}
export async function visibleCampaign(user: User, id: string) {
    const c = await db.campaign.findFirst({ where: { id, deletedAt: null }, include: { brand: true } });
    assert(c, 404, 'NOT_FOUND', 'Campaign not found.');
    if (!isAdmin(user) && c.brand.userId !== user.id) {
        const ownApplication = user.role === 'CREATOR' ? await db.application.findFirst({ where: { campaignId: id, creator: { userId: user.id }, deletedAt: null } }) : null;
        const member = await db.teamMember.findFirst({ where: { brandId: c.brandId, userId: user.id, deletedAt: null } });
        assert(c.status === 'LIVE' || ownApplication || member, 404, 'NOT_FOUND', 'Campaign not found.');
    }
    return c;
}
export function campaignFilters(query: Record<string, unknown>): Prisma.CampaignWhereInput {
    const statusMap: Record<string, string> = { Live: 'LIVE', Review: 'REVIEW', Completed: 'COMPLETED', Draft: 'DRAFT', Cancelled: 'CANCELLED' };
    const status = typeof query.status === 'string' ? (statusMap[query.status] ?? query.status) : undefined;
    return { deletedAt: null, ...(status ? { status: status as Campaign['status'] } : {}), ...(query.q ? { OR: [{ title: { contains: String(query.q), mode: 'insensitive' } }, { brief: { contains: String(query.q), mode: 'insensitive' } }] } : {}), ...(query.niche ? { niche: String(query.niche) } : {}), ...(query.country ? { countries: { has: String(query.country) } } : {}), ...(query.platform ? { platforms: { has: String(query.platform) } } : {}), ...((query.minBudget || query.maxBudget) ? { budget: { ...(query.minBudget ? { gte: Number(query.minBudget) } : {}), ...(query.maxBudget ? { lte: Number(query.maxBudget) } : {}) } } : {}) };
}
export async function acceptApplication(user: User, id: string, status: 'ACCEPTED' | 'REJECTED' | 'SHORTLISTED', rewardMinor?: number) {
    return transaction(async (tx) => {
        const app = await tx.application.findFirst({ where: { id, deletedAt: null }, include: { campaign: { include: { brand: true } }, creator: true } });
        assert(app, 404, 'NOT_FOUND', 'Application not found.');
        const member = isAdmin(user) || app.campaign.brand.userId === user.id ? true : await tx.teamMember.findFirst({ where: { brandId: app.campaign.brandId, userId: user.id, permission: 'EDITOR', deletedAt: null } });
        assert(!app.campaign.deletedAt && member, 403, 'FORBIDDEN', 'You cannot review this application.');
        assert(['PENDING', 'SHORTLISTED'].includes(app.status), 409, 'INVALID_TRANSITION', 'This application has already been processed.');
        if (status === 'ACCEPTED') {
            if ((rewardMinor ?? app.rewardMinor) > 0) {
                const wallet = await tx.wallet.findUnique({ where: { creatorId: app.creatorId } });
                assert(wallet && wallet.currency === app.campaign.currency, 409, 'CURRENCY_MISMATCH', 'Creator wallet and campaign currencies must match.');
            }
            const existing = await tx.application.aggregate({ where: { campaignId: app.campaignId, status: 'ACCEPTED', deletedAt: null }, _sum: { rewardMinor: true } });
            assert((existing._sum.rewardMinor ?? 0) + (rewardMinor ?? app.rewardMinor) <= Math.round(Number(app.campaign.budget) * 100), 409, 'BUDGET_EXCEEDED', 'Agreed creator rewards exceed the campaign budget.');
        }
        const result = await tx.application.update({ where: { id }, data: { status, ...(rewardMinor !== undefined ? { rewardMinor } : {}), currency: app.campaign.currency } });
        await tx.auditLog.create({ data: { actorId: user.id, action: 'APPLICATION_' + status, resource: 'Application', resourceId: id, details: { rewardMinor: result.rewardMinor } } });
        await outbox(tx, 'notification', { userId: app.creator.userId, type: `application.${status.toLowerCase()}`, title: `Application ${status.toLowerCase()}`, body: app.campaign.title });
        return result;
    });
}
export async function moderatePost(user: User, id: string, status: 'APPROVED' | 'REJECTED' | 'REVISION_REQUESTED', reason?: string) {
    return transaction(async (tx) => {
        const post = await tx.post.findFirst({ where: { id, deletedAt: null }, include: { campaign: { include: { brand: true } }, application: true, creator: true } });
        assert(post, 404, 'NOT_FOUND', 'Content not found.');
        const member = isAdmin(user) || post.campaign.brand.userId === user.id ? true : await tx.teamMember.findFirst({ where: { brandId: post.campaign.brandId, userId: user.id, permission: 'EDITOR', deletedAt: null } });
        assert(!post.campaign.deletedAt && member, 403, 'FORBIDDEN', 'You cannot review this content.');
        assert(['SUBMITTED', 'REVISION_REQUESTED', 'REJECTED'].includes(post.status), 409, 'INVALID_TRANSITION', 'This content has already been processed.');
        if (status !== 'APPROVED')
            assert(reason, 400, 'REASON_REQUIRED', 'Provide a reason.');
        // One agreed application reward, paid on the first approved deliverable only.
        if (status === 'APPROVED') {
            const credited = await tx.post.count({ where: { applicationId: post.applicationId, creditedAt: { not: null } } });
            if (!credited && post.application.rewardMinor > 0) {
                const wallet = await tx.wallet.findUnique({ where: { creatorId: post.creatorId } });
                assert(wallet && wallet.currency === post.application.currency, 409, 'CURRENCY_MISMATCH', 'Wallet and reward currencies must match.');
                const amount = post.application.rewardMinor;
                await tx.wallet.update({ where: { id: wallet.id }, data: { availableMinor: { increment: amount } } });
                await tx.ledgerEntry.createMany({ data: [{ walletId: wallet.id, transactionId: `reward:${post.applicationId}`, account: 'CREATOR_AVAILABLE', amountMinor: amount, reference: id }, { walletId: wallet.id, transactionId: `reward:${post.applicationId}`, account: 'PLATFORM_PAYABLE', amountMinor: -amount, reference: id }] });
                await tx.post.update({ where: { id }, data: { creditedAt: new Date() } });
            }
        }
        const result = await tx.post.update({ where: { id }, data: { status, rejectionReason: reason ?? null } });
        await tx.auditLog.create({ data: { actorId: user.id, action: 'CONTENT_' + status, resource: 'Post', resourceId: id, details: { reason: reason ?? null } } });
        await outbox(tx, 'notification', { userId: post.creator.userId, type: `content.${status.toLowerCase()}`, title: `Content ${status.toLowerCase()}`, body: reason ?? post.campaign.title });
        return result;
    });
}
export async function ensureEntitled(tx: Prisma.TransactionClient, userId: string) {
    const account = await tx.user.findUnique({ where: { id: userId } });
    assert(account?.termsAcceptedAt, 403, 'TERMS_REQUIRED', 'Accept the current terms before launching campaigns.');
    const sub = await tx.subscription.findFirst({ where: { userId, deletedAt: null }, orderBy: { createdAt: 'desc' } });
    const valid = sub && (sub.status === 'ACTIVE' || sub.status === 'TRIALING' && sub.trialEndsAt && sub.trialEndsAt > new Date() || sub.status === 'CANCELLED' && sub.currentPeriodEnd && sub.currentPeriodEnd > new Date());
    assert(valid, 402, 'SUBSCRIPTION_REQUIRED', 'Choose an active plan to launch campaigns.');
    return sub;
}
export async function createCampaign(user: User, input: Prisma.CampaignUncheckedCreateInput) {
    return transaction(async (tx) => {
        const brand = await tx.brandProfile.findFirst({ where: { id: input.brandId, userId: user.id, deletedAt: null } });
        assert(brand, 403, 'FORBIDDEN', 'You cannot create campaigns for this brand.');
        const subscription = await ensureEntitled(tx, brand.userId);
        if (subscription.plan === 'SELF_SERVICE' && input.status !== 'DRAFT')
            assert(await tx.campaign.count({ where: { brandId: brand.id, deletedAt: null, status: { in: ['REVIEW', 'LIVE'] } } }) < 3, 409, 'PLAN_LIMIT', 'Self Service supports three active campaigns.');
        return tx.campaign.create({ data: input });
    });
}
