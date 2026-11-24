import { z } from 'zod';
import { AppError, assert } from '../../core/http';
import { decrypt } from '../../core/security';
import { env } from '../../config';
export type Metrics = {
    views: number;
    likes: number;
    comments: number;
    shares: number;
    reach: number;
};
export interface SocialAdapter {
    metrics(postUrl: string, accessToken?: string): Promise<Metrics>;
    profile(handle: string, accessToken?: string): Promise<{
        bio: string;
        followers: number;
    }>;
}
const counts = z.coerce.number().int().nonnegative().max(2147483647).catch(0);
async function json(url: string, token?: string): Promise<Record<string, unknown>> {
    const response = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {}, signal: AbortSignal.timeout(10000) });
    if (response.status === 429)
        throw new AppError(429, 'SOCIAL_RATE_LIMIT', 'Social provider rate limit reached.');
    if (!response.ok)
        throw new AppError(502, 'SOCIAL_PROVIDER_ERROR', `Social provider returned ${response.status}.`);
    return await response.json() as Record<string, unknown>;
}
export class MockAdapter implements SocialAdapter {
    async metrics(url: string): Promise<Metrics> { assert(env.NODE_ENV !== 'production', 503, 'MOCK_DISABLED', 'Mock metrics are disabled.'); const seed = [...url].reduce((n, c) => n + c.charCodeAt(0), 0); const days = Math.floor(Date.now() / 86400000); const views = 1000 + seed * 10 + (days % 1000) * 250; return { views, likes: Math.floor(views * 0.058), comments: Math.floor(views * 0.007), shares: Math.floor(views * 0.012), reach: Math.floor(views * 0.83) }; }
    async profile(handle: string) { return { bio: env.MOCK_SOCIAL_BIO ?? `Development fixture ${handle}`, followers: 10000 }; }
}
export class YouTubeAdapter implements SocialAdapter {
    async metrics(url: string, token?: string) { const parsed = new URL(url); assert(['youtube.com', 'www.youtube.com', 'youtu.be', 'm.youtube.com'].includes(parsed.hostname), 400, 'INVALID_POST_URL', 'Use a YouTube post URL.'); const id = parsed.hostname === 'youtu.be' ? parsed.pathname.slice(1) : parsed.searchParams.get('v') ?? parsed.pathname.split('/').pop(); assert(id && /^[\w-]{11}$/.test(id), 400, 'INVALID_VIDEO_ID', 'Invalid YouTube video ID.'); assert(token, 503, 'SOCIAL_TOKEN_REQUIRED', 'Connect a YouTube access token.'); const d = await json(`https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${id}`, token); const item = (d.items as {
        statistics: Record<string, string>;
    }[] | undefined)?.[0]; assert(item, 404, 'SOCIAL_NOT_FOUND', 'Video statistics unavailable.'); return { views: counts.parse(item.statistics.viewCount), likes: counts.parse(item.statistics.likeCount), comments: counts.parse(item.statistics.commentCount), shares: 0, reach: 0 }; }
    async profile(handle: string, token?: string) { assert(token, 503, 'SOCIAL_TOKEN_REQUIRED', 'Connect a YouTube access token.'); const d = await json('https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true', token); const item = (d.items as {
        snippet: {
            customUrl?: string;
            description: string;
        };
        statistics: {
            subscriberCount: string;
        };
    }[] | undefined)?.[0]; assert(item && item.snippet.customUrl?.replace(/^@/, '').toLowerCase() === handle.replace(/^@/, '').toLowerCase(), 403, 'HANDLE_MISMATCH', 'Token does not own this channel.'); return { bio: item.snippet.description, followers: counts.parse(item.statistics.subscriberCount) }; }
}
export class InstagramAdapter implements SocialAdapter {
    async profile(handle: string, token?: string) { assert(token, 503, 'SOCIAL_TOKEN_REQUIRED', 'Connect an Instagram professional account token.'); const d = await json('https://graph.instagram.com/v22.0/me?fields=user_id,username,biography,followers_count', token); assert(String(d.username).toLowerCase() === handle.replace(/^@/, '').toLowerCase(), 403, 'HANDLE_MISMATCH', 'Token does not own this profile.'); return { bio: String(d.biography ?? ''), followers: counts.parse(d.followers_count) }; }
    async metrics(url: string, token?: string) { assert(token, 503, 'SOCIAL_TOKEN_REQUIRED', 'Connect an Instagram professional account token.'); const profile = await json('https://graph.instagram.com/v22.0/me/media?fields=id,permalink&limit=100', token); const item = (profile.data as {
        id: string;
        permalink: string;
    }[] | undefined)?.find(x => x.permalink.replace(/\/$/, '') === url.replace(/\/$/, '')); assert(item, 404, 'SOCIAL_NOT_FOUND', 'Post not found in connected media.'); const d = await json(`https://graph.instagram.com/v22.0/${encodeURIComponent(item.id)}/insights?metric=views,likes,comments,shares,reach`, token); const data = d.data as {
        name: string;
        values?: {
            value: number;
        }[];
        total_value?: {
            value: number;
        };
    }[]; const get = (key: string) => counts.parse(data.find(x => x.name === key)?.values?.[0]?.value ?? data.find(x => x.name === key)?.total_value?.value); return { views: get('views'), likes: get('likes'), comments: get('comments'), shares: get('shares'), reach: get('reach') }; }
}
export class TikTokAdapter implements SocialAdapter {
    async profile(handle: string, token?: string) { assert(token, 503, 'SOCIAL_TOKEN_REQUIRED', 'Connect a TikTok access token.'); const d = await json('https://open.tiktokapis.com/v2/user/info/?fields=username,bio_description,follower_count', token); const user = (d.data as {
        user?: {
            username: string;
            bio_description: string;
            follower_count: number;
        };
    })?.user; assert(user && user.username.toLowerCase() === handle.replace(/^@/, '').toLowerCase(), 403, 'HANDLE_MISMATCH', 'Token does not own this profile.'); return { bio: user.bio_description, followers: counts.parse(user.follower_count) }; }
    async metrics(url: string, token?: string) { assert(token, 503, 'SOCIAL_TOKEN_REQUIRED', 'Connect a TikTok access token.'); const parsed = new URL(url); assert(['tiktok.com', 'www.tiktok.com'].includes(parsed.hostname), 400, 'INVALID_POST_URL', 'Use a TikTok post URL.'); const id = parsed.pathname.match(/\/video\/(\d+)/)?.[1]; assert(id, 400, 'INVALID_VIDEO_ID', 'Use a full TikTok video URL.'); const response = await fetch('https://open.tiktokapis.com/v2/video/query/?fields=id,view_count,like_count,comment_count,share_count', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ filters: { video_ids: [id] } }), signal: AbortSignal.timeout(10000) }); if (response.status === 429)
        throw new AppError(429, 'SOCIAL_RATE_LIMIT', 'TikTok rate limit reached.'); assert(response.ok, 502, 'SOCIAL_PROVIDER_ERROR', 'TikTok request failed.'); const d = await response.json() as {
        data?: {
            videos?: Record<string, unknown>[];
        };
    }; const item = d.data?.videos?.[0]; assert(item, 404, 'SOCIAL_NOT_FOUND', 'TikTok video unavailable.'); return { views: counts.parse(item.view_count), likes: counts.parse(item.like_count), comments: counts.parse(item.comment_count), shares: counts.parse(item.share_count), reach: 0 }; }
}
export function adapter(platform: string): SocialAdapter { if (env.SOCIAL_MODE === 'mock')
    return new MockAdapter(); if (platform === 'YouTube')
    return new YouTubeAdapter(); if (platform === 'Instagram')
    return new InstagramAdapter(); if (platform === 'TikTok')
    return new TikTokAdapter(); throw new AppError(400, 'INVALID_PLATFORM', 'Unsupported social platform.'); }
export function socialToken(encrypted: string | null): string | undefined { const value = encrypted ? decrypt(encrypted) : undefined; return typeof value === 'string' ? value : undefined; }
