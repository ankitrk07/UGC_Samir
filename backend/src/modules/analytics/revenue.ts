import type { User } from '@prisma/client';
import { transaction } from '../../core/db';
import { assert, isAdmin } from '../../core/http';
export async function recordRevenue(user: User, campaignId: string, input: {
    eventId: string;
    creatorId: string;
    platform: string;
    country: string;
    date: string;
    revenueMinor: number;
    spendMinor: number;
    currency: string;
}) {
    return transaction(async (tx) => {
        const campaign = await tx.campaign.findFirst({ where: { id: campaignId, deletedAt: null }, include: { brand: true } });
        assert(campaign && (isAdmin(user) || campaign.brand.userId === user.id), 403, 'FORBIDDEN', 'You cannot update campaign revenue.');
        assert(campaign.currency === input.currency, 409, 'CURRENCY_MISMATCH', 'Revenue currency must match the campaign.');
        const existing = await tx.revenueEvent.findUnique({ where: { eventId: input.eventId } });
        if (existing) {
            assert(existing.campaignId === campaignId && existing.revenueMinor === input.revenueMinor && existing.spendMinor === input.spendMinor, 409, 'IDEMPOTENCY_CONFLICT', 'Revenue event identifier is already used.');
            return existing;
        }
        if (input.creatorId)
            assert(await tx.application.count({ where: { campaignId, creatorId: input.creatorId, status: 'ACCEPTED', deletedAt: null } }), 400, 'INVALID_CREATOR', 'Creator must be accepted on the campaign.');
        const event = await tx.revenueEvent.create({ data: { eventId: input.eventId, campaignId, revenueMinor: input.revenueMinor, spendMinor: input.spendMinor, currency: input.currency } });
        const keys = { campaignId, creatorId: input.creatorId, platform: input.platform, country: input.country, date: new Date(input.date + 'T00:00:00Z') };
        await tx.analyticsDaily.upsert({ where: { campaignId_creatorId_platform_country_date: keys }, create: { ...keys, brandId: campaign.brandId, revenueMinor: input.revenueMinor, spendMinor: input.spendMinor }, update: { revenueMinor: { increment: input.revenueMinor }, spendMinor: { increment: input.spendMinor } } });
        return event;
    });
}
