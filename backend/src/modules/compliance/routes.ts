import type { Express } from 'express';
import { z } from 'zod';
import argon2 from 'argon2';
import { db, transaction } from '../../core/db';
import { route, ok, requireUser, assert, audit, rateLimit } from '../../core/http';
import { opaqueToken,decrypt } from '../../core/security';
import { env } from '../../config';
export function complianceRoutes(app: Express) {
    app.use('/api/v1/compliance', rateLimit('compliance', 20, 3600));
    route(app, { method: 'post', path: '/compliance/consent', summary: 'Append cookie-consent decision', schema: z.object({ anonymousId: z.string().min(16).max(100), necessary: z.literal(true), analytics: z.boolean(), marketing: z.boolean(), version: z.string().min(1).max(100) }).strict(), handler: async (req, res) => { const consent = await db.cookieConsent.create({ data: req.body }); return ok(res, { id: consent.id, createdAt: consent.createdAt }, null, 201); } });
    route(app, { method: 'post', path: '/compliance/terms', summary: 'Record current terms/privacy acceptance', auth: true, schema: z.object({ termsAccepted: z.literal(true), privacyAccepted: z.literal(true), version: z.string().max(100) }).strict(), handler: async (req, res) => { assert(req.body.version === env.TERMS_VERSION, 400, 'TERMS_VERSION', 'Accept the current terms version.'); await db.user.update({ where: { id: requireUser(req).id }, data: { termsAcceptedAt: new Date(), termsVersion: req.body.version } }); await audit(req, 'TERMS_PRIVACY_ACCEPTED', 'User', req.user!.id, { version: req.body.version }); return ok(res, { accepted: true }); } });
    route(app, { method: 'get', path: '/compliance/export', summary: 'Export own personal data (GDPR/DPDP)', auth: true, handler: async (req, res) => {
            const u = requireUser(req);
            const [brand, creator, subscriptions, payments, messages, notifications, consents, bookings, leads, contacts, newsletter] = await Promise.all([db.brandProfile.findUnique({ where: { userId: u.id }, include: { campaigns: { include: { applications: true, posts: true } } } }), db.creatorProfile.findUnique({ where: { userId: u.id }, select: { id: true, handle: true, country: true, niche: true, bio: true, portfolio: true,payoutDetailsEncrypted:true, socials: { select: { platform: true, handle: true, followers: true, verified: true } }, applications: true, posts: true, wallet: { include: { entries: true } }, payouts: { select: { id: true, amountMinor: true, currency: true, status: true, providerReference: true, createdAt: true } } } }), db.subscription.findMany({ where: { userId: u.id } }), db.payment.findMany({ where: { userId: u.id }, include: { invoice: true } }), db.message.findMany({ where: { senderId: u.id } }), db.notification.findMany({ where: { userId: u.id } }), db.cookieConsent.findMany({ where: { userId: u.id } }), db.bookCall.findMany({ where: { email: u.email }, select: { id: true, name: true, email: true, brand: true, timezone: true, status: true, notes: true, slot: true } }), db.lead.findMany({ where: { email: u.email } }), db.contactMessage.findMany({ where: { email: u.email } }), db.newsletterSubscriber.findUnique({ where: { email: u.email }, select: { email: true, confirmed: true, unsubscribedAt: true } })]);
            let creatorExport:unknown=null;if(creator){const {payoutDetailsEncrypted,...profile}=creator;creatorExport={...profile,payoutDetails:payoutDetailsEncrypted?decrypt(payoutDetailsEncrypted):null};}
            await audit(req, 'PERSONAL_DATA_EXPORTED', 'User', u.id);
            res.setHeader('Content-Disposition', 'attachment; filename="trendhive-personal-data.json"');
            return ok(res, { user: { id: u.id, name: u.name, email: u.email, role: u.role, preferences: u.preferences, createdAt: u.createdAt, termsVersion: u.termsVersion }, brand, creator:creatorExport, subscriptions, payments, messages, notifications, consents, bookings, leads, contacts, newsletter });
        } });
    route(app, { method: 'delete', path: '/compliance/account', summary: 'Reauthenticate, anonymize personal data and revoke sessions', auth: true, schema: z.object({ confirmation: z.literal('DELETE'), password: z.string().max(128).optional() }).strict(), handler: async (req, res) => {
            const u = requireUser(req);
            if (u.passwordHash)
                assert(req.body.password && await argon2.verify(u.passwordHash, req.body.password), 403, 'REAUTH_REQUIRED', 'Confirm your current password.');
            else {
                const session = await db.refreshToken.findUnique({ where: { id: req.sessionId } });
                assert(session && Date.now() - session.createdAt.getTime() < 900000, 403, 'REAUTH_REQUIRED', 'Sign in again before deleting your account.');
            }
            await transaction(async (tx) => {
                const creator = await tx.creatorProfile.findUnique({ where: { userId: u.id }, include: { wallet: true } });
                assert(!creator?.wallet || (creator.wallet.availableMinor === 0 && creator.wallet.reservedMinor === 0), 409, 'UNSETTLED_BALANCE', 'Settle your wallet balance before deleting the account.');
                assert(!await tx.subscription.count({ where: { userId: u.id, status: { in: ['ACTIVE', 'TRIALING', 'PAST_DUE'] } } }), 409, 'ACTIVE_SUBSCRIPTION', 'Cancel your subscription before deleting your account.');
                const now = new Date(), anon = `deleted-${opaqueToken()}@removed.invalid`;
                await tx.user.update({ where: { id: u.id }, data: { name: 'Deleted account', email: anon, passwordHash: null, preferences: {}, deletedAt: now } });
                await tx.refreshToken.updateMany({ where: { userId: u.id }, data: { revokedAt: now } });
                await tx.oAuthAccount.deleteMany({ where: { userId: u.id } });
                await tx.emailVerificationToken.deleteMany({ where: { userId: u.id } });
                await tx.passwordResetToken.deleteMany({ where: { userId: u.id } });
                if (creator) {
                    for (const social of await tx.socialAccount.findMany({ where: { creatorId: creator.id } }))
                        await tx.socialAccount.update({ where: { id: social.id }, data: { handle: 'deleted-' + social.id, verified: false, accessTokenEncrypted: null, verificationCode: null, deletedAt: now } });
                    await tx.creatorProfile.update({ where: { id: creator.id }, data: { handle: 'Deleted creator', country: '', niche: '', bio: '', portfolio: [], payoutDetailsEncrypted: null, deletedAt: now } });
                    await tx.post.updateMany({ where: { creatorId: creator.id }, data: { postUrl: '', videoUrl: null, thumbnail: null, deletedAt: now } });
                    await tx.application.updateMany({ where: { creatorId: creator.id }, data: { pitch: '[removed]', deletedAt: now } });
                    await tx.payout.updateMany({ where: { creatorId: creator.id }, data: { detailsEncrypted: '[removed]' } });
                }
                const brand = await tx.brandProfile.findUnique({ where: { userId: u.id } });
                if (brand) {
                    await tx.brandProfile.update({ where: { id: brand.id }, data: { brand: 'Deleted brand',gstin:null,billingName:null,billingAddress:null,website: '', countries: [], platforms: [], deletedAt: now } });
                    await tx.campaign.updateMany({ where: { brandId: brand.id }, data: { status: 'CANCELLED', deletedAt: now } });
                }
                await tx.message.updateMany({ where: { senderId: u.id }, data: { body: '[removed]', attachments: [], deletedAt: now } });
                await tx.conversationParticipant.updateMany({ where: { userId: u.id }, data: { deletedAt: now } });
                await tx.teamMember.updateMany({ where: { userId: u.id }, data: { deletedAt: now } });
                await tx.notification.updateMany({ where: { userId: u.id }, data: { body: '[removed]', deletedAt: now } });
                await tx.lead.updateMany({ where: { email: u.email }, data: { email: anon, name: null, details: {}, utmSource:null,utmMedium:null,utmCampaign:null,utmTerm:null,utmContent:null,deletedAt: now } });
                await tx.contactMessage.updateMany({ where: { email: u.email }, data: { email: anon, name: 'Deleted', message: '[removed]', deletedAt: now } });
                await tx.newsletterSubscriber.updateMany({ where: { email: u.email }, data: { email: anon, confirmed: false, unsubscribedAt: now, deletedAt: now } });
                await tx.bookCall.updateMany({ where: { email: u.email }, data: { email: anon, name: 'Deleted', brand:'',notes: null, status: 'CANCELLED', deletedAt: now } });
                for(const asset of await tx.mediaAsset.findMany({where:{uploadedBy:u.id,key:{not:null}}}))await tx.outboxEvent.create({data:{type:'media.purge',payload:{assetId:asset.id}}});
                    await tx.outboxEvent.updateMany({where:{OR:[{payload:{path:['to'],equals:u.email}},{payload:{path:['userId'],equals:u.id}}]},data:{payload:{redacted:true},processedAt:now}});
                    await tx.mediaAsset.updateMany({ where: { uploadedBy: u.id }, data: { showcase: false, deletedAt: now } });
                await tx.auditLog.create({ data: { actorId: u.id, action: 'ACCOUNT_ANONYMIZED', resource: 'User', resourceId: u.id, requestId: req.requestId, details: { retained: 'Pseudonymous financial records and security audit history' } } });
            });
            return ok(res, { deleted: true, message: 'Personal data anonymized; financial and security records retained under the retention policy.' });
        } });
}
