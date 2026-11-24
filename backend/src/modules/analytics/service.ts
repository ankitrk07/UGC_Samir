import { DateTime } from 'luxon';
import type { AnalyticsDaily, User, Prisma } from '@prisma/client';
import { db, cached } from '../../core/db';
import { assert, isAdmin } from '../../core/http';

export function summarize(rows: Pick<AnalyticsDaily, 'date' | 'views' | 'likes' | 'comments' | 'shares' | 'reach' | 'revenueMinor' | 'spendMinor' | 'creatorId' | 'platform' | 'country'>[], from: Date, to: Date) {
    const totals = { views: 0, interactions: 0, reach: 0, revenueMinor: 0, spendMinor: 0 };
    const groups = new Map<string, {
        views: number;
        interactions: number;
        revenue: number;
        spend: number;
    }>();
    for (const r of rows) {
        totals.views += r.views;
        totals.interactions += r.likes + r.comments + r.shares;
        totals.reach += r.reach;
        totals.revenueMinor += r.revenueMinor;
        totals.spendMinor += r.spendMinor;
        const key = r.date.toISOString().slice(0, 10);
        const g = groups.get(key) ?? { views: 0, interactions: 0, revenue: 0, spend: 0 };
        g.views += r.views;
        g.interactions += r.likes + r.comments + r.shares;
        g.revenue += r.revenueMinor;
        g.spend += r.spendMinor;
        groups.set(key, g);
    }
    const series = [];
    for (let d = DateTime.fromJSDate(from, { zone: 'utc' }).startOf('day'); d.toMillis() <= to.getTime(); d = d.plus({ days: 1 })) {
        const g = groups.get(d.toISODate()!) ?? { views: 0, interactions: 0, revenue: 0, spend: 0 };
        series.push({ day: d.toFormat('dd'), date: d.toISODate(), views: g.views / 1000, engagement: g.views ? Math.round(g.interactions / g.views * 10000) / 100 : 0, roi: g.spend ? g.revenue / g.spend : 0 });
    }
    const breakdown = (field: 'platform' | 'country') => [...new Set(rows.map(x => x[field]))].map(key => ({ [field]: key, views: rows.filter(x => x[field] === key).reduce((sum, x) => sum + x.views, 0) }));
    return { totalViews: totals.views, engagement: totals.views ? Math.round(totals.interactions / totals.views * 10000) / 100 : 0, activeCreators: new Set(rows.filter(x => x.creatorId).map(x => x.creatorId)).size, earnedValue: totals.revenueMinor / 100, reach: totals.reach, cpv: totals.views ? totals.spendMinor / 100 / totals.views : 0, roi: totals.spendMinor ? totals.revenueMinor / totals.spendMinor : 0, series, platforms: breakdown('platform'), countries: breakdown('country') };
}
export async function analyticsScope(user: User, query: {
    currency?: string;
    days: number;
    from?: string;
    to?: string;
    campaignId?: string;
    platform?: string;
    country?: string;
}) {
    const to = query.to ? DateTime.fromISO(query.to, { zone: 'utc' }).endOf('day') : DateTime.utc().endOf('day');
    const from = query.from ? DateTime.fromISO(query.from, { zone: 'utc' }).startOf('day') : to.minus({ days: query.days - 1 }).startOf('day');
    assert(from.isValid && to.isValid && to >= from && to.diff(from, 'days').days <= 366, 400, 'INVALID_RANGE', 'Choose a date range of at most one year.');
    if (query.campaignId) {
        if (user.role === 'CREATOR') {
            const own = await db.application.count({ where: { creator: { userId: user.id }, campaignId: query.campaignId, deletedAt: null } });
            assert(own, 403, 'FORBIDDEN', 'Campaign analytics are unavailable.');
        }
        else { const owned=await db.campaign.count({where:{id:query.campaignId,deletedAt:null,...(isAdmin(user)?{}:{brand:{OR:[{userId:user.id},{team:{some:{userId:user.id,deletedAt:null}}}]}})}}); assert(owned,403,'FORBIDDEN','Campaign analytics are unavailable.'); }
    }
    const where: Prisma.AnalyticsDailyWhereInput = { date: { gte: from.toJSDate(), lte: to.toJSDate() }, campaign: { deletedAt: null, currency: query.currency ?? 'USD' }, ...(query.campaignId ? { campaignId: query.campaignId } : {}), ...(query.platform ? { platform: query.platform } : {}), ...(query.country ? { country: query.country } : {}), ...(isAdmin(user) ? {} : user.role === 'BRAND' ? { campaign: { brand: { OR: [{ userId: user.id }, { team: { some: { userId: user.id, deletedAt: null } } }] }, deletedAt: null, currency: query.currency ?? 'USD' } } : { creatorId: (await db.creatorProfile.findUniqueOrThrow({ where: { userId: user.id } })).id }) };
    return {where,from:from.toJSDate(),to:to.toJSDate()};
}
export async function analytics(user: User, query: Parameters<typeof analyticsScope>[1]) {
    const {where,from,to}=await analyticsScope(user,query);
    return cached(`analytics:${user.id}:${JSON.stringify(where)}`, 30, async () => summarize(await db.analyticsDaily.findMany({ where }), from, to));
}
