import { DateTime } from 'luxon';
import { db, redis, transaction } from '../../core/db';
import { assert } from '../../core/http';
import { adapter, socialToken } from './adapters';
export async function syncPost(postId: string) {
    const post = await db.post.findFirst({ where: { id: postId, deletedAt: null, status: 'LIVE' }, include: { campaign: { include: { brand: true } }, creator: { include: { socials: true } } } });
    if (!post)
        return;
    const social = post.creator.socials.find(x => x.platform === post.platform && x.verified && !x.deletedAt);
    assert(social, 409, 'SOCIAL_UNVERIFIED', 'A verified social profile is required.');
    const metrics = await adapter(post.platform).metrics(post.postUrl, socialToken(social.accessTokenEncrypted));
    await transaction(async (tx) => {
        const previous = await tx.postMetricSnapshot.findFirst({ where: { postId }, orderBy: { capturedAt: 'desc' } });
        await tx.post.update({where:{id:postId},data:{latestViews:metrics.views}});
        await tx.postMetricSnapshot.create({ data: { postId, ...metrics } });
        const delta = { views: Math.max(0, metrics.views - (previous?.views ?? 0)), likes: Math.max(0, metrics.likes - (previous?.likes ?? 0)), comments: Math.max(0, metrics.comments - (previous?.comments ?? 0)), shares: Math.max(0, metrics.shares - (previous?.shares ?? 0)), reach: Math.max(0, metrics.reach - (previous?.reach ?? 0)) };
        const keys = { campaignId: post.campaignId, creatorId: post.creatorId, platform: post.platform, country: post.creator.country, date: DateTime.utc().startOf('day').toJSDate() };
        await tx.analyticsDaily.upsert({ where: { campaignId_creatorId_platform_country_date: keys }, create: { ...keys, brandId: post.campaign.brandId, ...delta }, update: { views: { increment: delta.views }, likes: { increment: delta.likes }, comments: { increment: delta.comments }, shares: { increment: delta.shares }, reach: { increment: delta.reach } } });
        await tx.socialAccount.update({ where: { id: social.id }, data: { lastSyncedAt: new Date() } });
    });
    for (const userId of [post.campaign.brand.userId, post.creator.userId])
        await redis.publish('trendhive:realtime', JSON.stringify({ room: 'user:' + userId, event: 'analytics.updated', data: { campaignId: post.campaignId, postId: post.id } }));
}
