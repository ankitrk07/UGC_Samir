-- Initial PostgreSQL schema. Prisma client supplies cuid IDs and updatedAt values.
CREATE TYPE "Role" AS ENUM ('BRAND', 'CREATOR', 'ADMIN', 'SUPERADMIN');
CREATE TYPE "CampaignStatus" AS ENUM ('DRAFT', 'REVIEW', 'LIVE', 'COMPLETED', 'CANCELLED');
CREATE TYPE "ApplicationStatus" AS ENUM ('PENDING', 'SHORTLISTED', 'ACCEPTED', 'REJECTED', 'WITHDRAWN');
CREATE TYPE "ContentStatus" AS ENUM ('SUBMITTED', 'APPROVED', 'REJECTED', 'REVISION_REQUESTED', 'LIVE');
CREATE TYPE "Plan" AS ENUM ('SELF_SERVICE', 'FULL_SERVICE');
CREATE TYPE "SubscriptionStatus" AS ENUM ('TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELLED', 'EXPIRED');
CREATE TYPE "PayoutStatus" AS ENUM ('REQUESTED', 'APPROVED', 'PROCESSING', 'PAID', 'FAILED', 'REJECTED');
CREATE TYPE "BookingStatus" AS ENUM ('CONFIRMED', 'CANCELLED', 'COMPLETED');

CREATE TABLE "User" (
 "id" TEXT NOT NULL PRIMARY KEY,
 "email" TEXT NOT NULL,
 "name" TEXT NOT NULL,
 "passwordHash" TEXT,
 "role" "Role" NOT NULL DEFAULT 'BRAND',
 "emailVerifiedAt" TIMESTAMP(3),
 "bannedAt" TIMESTAMP(3),
 "failedLogins" INTEGER NOT NULL DEFAULT 0,
 "lockedUntil" TIMESTAMP(3),
 "preferences" JSONB NOT NULL DEFAULT '{}',
 "termsAcceptedAt" TIMESTAMP(3),
 "termsVersion" TEXT,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "updatedAt" TIMESTAMP(3) NOT NULL,
 "deletedAt" TIMESTAMP(3)
);

CREATE TABLE "RefreshToken" (
 "id" TEXT NOT NULL PRIMARY KEY,
 "userId" TEXT NOT NULL,
 "tokenHash" TEXT NOT NULL,
 "family" TEXT NOT NULL,
 "expiresAt" TIMESTAMP(3) NOT NULL,
 "revokedAt" TIMESTAMP(3),
 "replacedBy" TEXT,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "EmailVerificationToken" (
 "id" TEXT NOT NULL PRIMARY KEY,
 "userId" TEXT NOT NULL,
 "tokenHash" TEXT NOT NULL,
 "expiresAt" TIMESTAMP(3) NOT NULL,
 "usedAt" TIMESTAMP(3),
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "PasswordResetToken" (
 "id" TEXT NOT NULL PRIMARY KEY,
 "userId" TEXT NOT NULL,
 "tokenHash" TEXT NOT NULL,
 "expiresAt" TIMESTAMP(3) NOT NULL,
 "usedAt" TIMESTAMP(3),
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "OAuthAccount" (
 "id" TEXT NOT NULL PRIMARY KEY,
 "userId" TEXT NOT NULL,
 "provider" TEXT NOT NULL,
 "providerAccountId" TEXT NOT NULL,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "BrandProfile" (
 "id" TEXT NOT NULL PRIMARY KEY,
 "userId" TEXT NOT NULL,
 "brand" TEXT NOT NULL DEFAULT '',
 "website" TEXT NOT NULL DEFAULT '',
 "goal" TEXT NOT NULL DEFAULT '',
 "budget" TEXT NOT NULL DEFAULT '',
 "countries" TEXT[] NOT NULL,
 "platforms" TEXT[] NOT NULL,
 "completedAt" TIMESTAMP(3),
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "updatedAt" TIMESTAMP(3) NOT NULL,
 "deletedAt" TIMESTAMP(3)
);

CREATE TABLE "TeamMember" (
 "id" TEXT NOT NULL PRIMARY KEY,
 "brandId" TEXT NOT NULL,
 "userId" TEXT NOT NULL,
 "permission" TEXT NOT NULL DEFAULT 'VIEWER',
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "updatedAt" TIMESTAMP(3) NOT NULL,
 "deletedAt" TIMESTAMP(3)
);

CREATE TABLE "TeamInvite" (
 "id" TEXT NOT NULL PRIMARY KEY,
 "brandId" TEXT NOT NULL,
 "email" TEXT NOT NULL,
 "permission" TEXT NOT NULL DEFAULT 'VIEWER',
 "tokenHash" TEXT NOT NULL,
 "expiresAt" TIMESTAMP(3) NOT NULL,
 "acceptedAt" TIMESTAMP(3),
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "CreatorProfile" (
 "id" TEXT NOT NULL PRIMARY KEY,
 "userId" TEXT NOT NULL,
 "handle" TEXT NOT NULL DEFAULT '',
 "country" TEXT NOT NULL DEFAULT '',
 "niche" TEXT NOT NULL DEFAULT '',
 "bio" TEXT NOT NULL DEFAULT '',
 "followers" INTEGER NOT NULL DEFAULT 0,
 "engagement" DOUBLE PRECISION NOT NULL DEFAULT 0,
 "verifiedAt" TIMESTAMP(3),
 "payoutDetailsEncrypted" TEXT,
 "portfolio" JSONB NOT NULL DEFAULT '[]',
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "updatedAt" TIMESTAMP(3) NOT NULL,
 "deletedAt" TIMESTAMP(3)
);

CREATE TABLE "SocialAccount" (
 "id" TEXT NOT NULL PRIMARY KEY,
 "creatorId" TEXT NOT NULL,
 "platform" TEXT NOT NULL,
 "handle" TEXT NOT NULL,
 "followers" INTEGER NOT NULL DEFAULT 0,
 "verified" BOOLEAN NOT NULL DEFAULT false,
 "verificationCode" TEXT,
 "verificationExpiresAt" TIMESTAMP(3),
 "accessTokenEncrypted" TEXT,
 "lastSyncedAt" TIMESTAMP(3),
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "updatedAt" TIMESTAMP(3) NOT NULL,
 "deletedAt" TIMESTAMP(3)
);

CREATE TABLE "Campaign" (
 "id" TEXT NOT NULL PRIMARY KEY,
 "brandId" TEXT NOT NULL,
 "title" TEXT NOT NULL,
 "brief" TEXT NOT NULL,
 "goal" TEXT NOT NULL DEFAULT 'Awareness',
 "budget" DECIMAL(14,2) NOT NULL,
 "currency" TEXT NOT NULL DEFAULT 'USD',
 "platforms" TEXT[] NOT NULL,
 "countries" TEXT[] NOT NULL,
 "niche" TEXT NOT NULL,
 "status" "CampaignStatus" NOT NULL DEFAULT 'REVIEW',
 "startDate" TIMESTAMP(3),
 "endDate" TIMESTAMP(3),
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "updatedAt" TIMESTAMP(3) NOT NULL,
 "deletedAt" TIMESTAMP(3)
);

CREATE TABLE "CampaignDeliverable" (
 "id" TEXT NOT NULL PRIMARY KEY,
 "campaignId" TEXT NOT NULL,
 "platform" TEXT NOT NULL,
 "type" TEXT NOT NULL,
 "quantity" INTEGER NOT NULL DEFAULT 1,
 "rewardMinor" INTEGER NOT NULL DEFAULT 0,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "updatedAt" TIMESTAMP(3) NOT NULL,
 "deletedAt" TIMESTAMP(3)
);

CREATE TABLE "Application" (
 "id" TEXT NOT NULL PRIMARY KEY,
 "campaignId" TEXT NOT NULL,
 "creatorId" TEXT NOT NULL,
 "status" "ApplicationStatus" NOT NULL DEFAULT 'PENDING',
 "pitch" TEXT NOT NULL,
 "rewardMinor" INTEGER NOT NULL DEFAULT 0,
 "currency" TEXT NOT NULL DEFAULT 'USD',
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "updatedAt" TIMESTAMP(3) NOT NULL,
 "deletedAt" TIMESTAMP(3)
);

CREATE TABLE "Post" (
 "id" TEXT NOT NULL PRIMARY KEY,
 "campaignId" TEXT NOT NULL,
 "creatorId" TEXT NOT NULL,
 "applicationId" TEXT NOT NULL,
 "platform" TEXT NOT NULL,
 "postUrl" TEXT NOT NULL,
 "videoUrl" TEXT,
 "thumbnail" TEXT,
 "status" "ContentStatus" NOT NULL DEFAULT 'SUBMITTED',
 "rejectionReason" TEXT,
 "creditedAt" TIMESTAMP(3),
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "updatedAt" TIMESTAMP(3) NOT NULL,
 "deletedAt" TIMESTAMP(3)
);

CREATE TABLE "PostMetricSnapshot" (
 "id" TEXT NOT NULL PRIMARY KEY,
 "postId" TEXT NOT NULL,
 "views" INTEGER NOT NULL,
 "likes" INTEGER NOT NULL,
 "comments" INTEGER NOT NULL,
 "shares" INTEGER NOT NULL,
 "reach" INTEGER NOT NULL DEFAULT 0,
 "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "AnalyticsDaily" (
 "id" TEXT NOT NULL PRIMARY KEY,
 "campaignId" TEXT NOT NULL,
 "creatorId" TEXT NOT NULL DEFAULT '',
 "brandId" TEXT NOT NULL,
 "platform" TEXT NOT NULL,
 "country" TEXT NOT NULL,
 "date" DATE NOT NULL,
 "views" INTEGER NOT NULL DEFAULT 0,
 "likes" INTEGER NOT NULL DEFAULT 0,
 "comments" INTEGER NOT NULL DEFAULT 0,
 "shares" INTEGER NOT NULL DEFAULT 0,
 "reach" INTEGER NOT NULL DEFAULT 0,
 "revenueMinor" INTEGER NOT NULL DEFAULT 0,
 "spendMinor" INTEGER NOT NULL DEFAULT 0,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "Subscription" (
 "id" TEXT NOT NULL PRIMARY KEY,
 "userId" TEXT NOT NULL,
 "plan" "Plan" NOT NULL DEFAULT 'SELF_SERVICE',
 "billing" TEXT NOT NULL DEFAULT 'monthly',
 "status" "SubscriptionStatus" NOT NULL DEFAULT 'TRIALING',
 "trialEndsAt" TIMESTAMP(3),
 "currentPeriodEnd" TIMESTAMP(3),
 "provider" TEXT,
 "providerSubId" TEXT,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "updatedAt" TIMESTAMP(3) NOT NULL,
 "deletedAt" TIMESTAMP(3)
);

CREATE TABLE "Payment" (
 "id" TEXT NOT NULL PRIMARY KEY,
 "userId" TEXT NOT NULL,
 "subscriptionId" TEXT,
 "provider" TEXT NOT NULL,
 "providerPaymentId" TEXT NOT NULL,
 "amountMinor" INTEGER NOT NULL,
 "currency" TEXT NOT NULL,
 "status" TEXT NOT NULL,
 "refundedMinor" INTEGER NOT NULL DEFAULT 0,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "updatedAt" TIMESTAMP(3) NOT NULL,
 "deletedAt" TIMESTAMP(3)
);

CREATE TABLE "Invoice" (
 "id" TEXT NOT NULL PRIMARY KEY,
 "paymentId" TEXT NOT NULL,
 "number" TEXT NOT NULL,
 "gstin" TEXT,
 "billingName" TEXT NOT NULL,
 "billingAddress" TEXT,
 "taxMinor" INTEGER NOT NULL DEFAULT 0,
 "taxRate" DECIMAL(5,2) NOT NULL DEFAULT 0,
 "pdfUrl" TEXT,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "updatedAt" TIMESTAMP(3) NOT NULL,
 "deletedAt" TIMESTAMP(3)
);

CREATE TABLE "Wallet" (
 "id" TEXT NOT NULL PRIMARY KEY,
 "creatorId" TEXT NOT NULL,
 "currency" TEXT NOT NULL DEFAULT 'USD',
 "availableMinor" INTEGER NOT NULL DEFAULT 0,
 "reservedMinor" INTEGER NOT NULL DEFAULT 0,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "LedgerEntry" (
 "id" TEXT NOT NULL PRIMARY KEY,
 "walletId" TEXT NOT NULL,
 "transactionId" TEXT NOT NULL,
 "account" TEXT NOT NULL,
 "amountMinor" INTEGER NOT NULL,
 "reference" TEXT NOT NULL,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "Payout" (
 "id" TEXT NOT NULL PRIMARY KEY,
 "creatorId" TEXT NOT NULL,
 "amountMinor" INTEGER NOT NULL,
 "currency" TEXT NOT NULL,
 "status" "PayoutStatus" NOT NULL DEFAULT 'REQUESTED',
 "idempotencyKey" TEXT NOT NULL,
 "providerReference" TEXT,
 "detailsEncrypted" TEXT NOT NULL,
 "failureReason" TEXT,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "updatedAt" TIMESTAMP(3) NOT NULL,
 "deletedAt" TIMESTAMP(3)
);

CREATE TABLE "Conversation" (
 "id" TEXT NOT NULL PRIMARY KEY,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "updatedAt" TIMESTAMP(3) NOT NULL,
 "deletedAt" TIMESTAMP(3)
);

CREATE TABLE "ConversationParticipant" (
 "id" TEXT NOT NULL PRIMARY KEY,
 "conversationId" TEXT NOT NULL,
 "userId" TEXT NOT NULL,
 "lastReadAt" TIMESTAMP(3),
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "updatedAt" TIMESTAMP(3) NOT NULL,
 "deletedAt" TIMESTAMP(3)
);

CREATE TABLE "Message" (
 "id" TEXT NOT NULL PRIMARY KEY,
 "conversationId" TEXT NOT NULL,
 "senderId" TEXT NOT NULL,
 "body" TEXT NOT NULL,
 "attachments" JSONB NOT NULL DEFAULT '[]',
 "readAt" TIMESTAMP(3),
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "updatedAt" TIMESTAMP(3) NOT NULL,
 "deletedAt" TIMESTAMP(3)
);

CREATE TABLE "Notification" (
 "id" TEXT NOT NULL PRIMARY KEY,
 "userId" TEXT NOT NULL,
 "type" TEXT NOT NULL,
 "title" TEXT NOT NULL,
 "body" TEXT NOT NULL,
 "link" TEXT,
 "readAt" TIMESTAMP(3),
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "updatedAt" TIMESTAMP(3) NOT NULL,
 "deletedAt" TIMESTAMP(3)
);

CREATE TABLE "AvailabilitySlot" (
 "id" TEXT NOT NULL PRIMARY KEY,
 "startsAt" TIMESTAMP(3) NOT NULL,
 "endsAt" TIMESTAMP(3) NOT NULL,
 "enabled" BOOLEAN NOT NULL DEFAULT true,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "updatedAt" TIMESTAMP(3) NOT NULL,
 "deletedAt" TIMESTAMP(3)
);

CREATE TABLE "BookCall" (
 "id" TEXT NOT NULL PRIMARY KEY,
 "slotId" TEXT NOT NULL,
 "userId" TEXT,
 "email" TEXT NOT NULL,
 "name" TEXT NOT NULL,
 "brand" TEXT NOT NULL,
 "timezone" TEXT NOT NULL,
 "status" "BookingStatus" NOT NULL DEFAULT 'CONFIRMED',
 "notes" TEXT,
 "meetingLink" TEXT,
 "managementTokenHash" TEXT NOT NULL,
 "reminderSentAt" TIMESTAMP(3),
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "updatedAt" TIMESTAMP(3) NOT NULL,
 "deletedAt" TIMESTAMP(3)
);

CREATE TABLE "Lead" (
 "id" TEXT NOT NULL PRIMARY KEY,
 "email" TEXT NOT NULL,
 "name" TEXT,
 "source" TEXT NOT NULL,
 "utmSource" TEXT,
 "utmMedium" TEXT,
 "utmCampaign" TEXT,
 "utmTerm" TEXT,
 "utmContent" TEXT,
 "details" JSONB NOT NULL DEFAULT '{}',
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "updatedAt" TIMESTAMP(3) NOT NULL,
 "deletedAt" TIMESTAMP(3)
);

CREATE TABLE "ContactMessage" (
 "id" TEXT NOT NULL PRIMARY KEY,
 "name" TEXT NOT NULL,
 "email" TEXT NOT NULL,
 "message" TEXT NOT NULL,
 "status" TEXT NOT NULL DEFAULT 'NEW',
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "updatedAt" TIMESTAMP(3) NOT NULL,
 "deletedAt" TIMESTAMP(3)
);

CREATE TABLE "NewsletterSubscriber" (
 "id" TEXT NOT NULL PRIMARY KEY,
 "email" TEXT NOT NULL,
 "confirmed" BOOLEAN NOT NULL DEFAULT false,
 "confirmationTokenHash" TEXT NOT NULL,
 "confirmationExpiresAt" TIMESTAMP(3) NOT NULL,
 "unsubscribeToken" TEXT NOT NULL,
 "unsubscribedAt" TIMESTAMP(3),
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "updatedAt" TIMESTAMP(3) NOT NULL,
 "deletedAt" TIMESTAMP(3)
);

CREATE TABLE "MediaAsset" (
 "id" TEXT NOT NULL PRIMARY KEY,
 "uploadedBy" TEXT,
 "key" TEXT,
 "type" TEXT NOT NULL,
 "url" TEXT NOT NULL,
 "section" TEXT NOT NULL,
 "order" INTEGER NOT NULL DEFAULT 0,
 "finalPath" TEXT NOT NULL DEFAULT '',
 "size" TEXT NOT NULL DEFAULT '',
 "alt" TEXT NOT NULL,
 "mimeType" TEXT,
 "sizeBytes" INTEGER,
 "duration" DOUBLE PRECISION,
 "scanStatus" TEXT NOT NULL DEFAULT 'PENDING',
 "showcase" BOOLEAN NOT NULL DEFAULT false,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "updatedAt" TIMESTAMP(3) NOT NULL,
 "deletedAt" TIMESTAMP(3)
);

CREATE TABLE "SiteStat" (
 "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'main',
 "creators" INTEGER NOT NULL DEFAULT 0,
 "views" BIGINT NOT NULL DEFAULT 0,
 "posts" INTEGER NOT NULL DEFAULT 0,
 "countries" INTEGER NOT NULL DEFAULT 0,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "Testimonial" (
 "id" TEXT NOT NULL PRIMARY KEY,
 "type" TEXT NOT NULL,
 "quote" TEXT NOT NULL,
 "tag" TEXT NOT NULL,
 "initials" TEXT NOT NULL,
 "color" TEXT NOT NULL,
 "metric" TEXT NOT NULL,
 "label" TEXT NOT NULL,
 "order" INTEGER NOT NULL DEFAULT 0,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "updatedAt" TIMESTAMP(3) NOT NULL,
 "deletedAt" TIMESTAMP(3)
);

CREATE TABLE "FAQ" (
 "id" TEXT NOT NULL PRIMARY KEY,
 "question" TEXT NOT NULL,
 "answer" TEXT NOT NULL,
 "order" INTEGER NOT NULL DEFAULT 0,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "updatedAt" TIMESTAMP(3) NOT NULL,
 "deletedAt" TIMESTAMP(3)
);

CREATE TABLE "PricingPlan" (
 "id" TEXT NOT NULL PRIMARY KEY,
 "plan" "Plan" NOT NULL,
 "name" TEXT NOT NULL,
 "monthly" INTEGER NOT NULL,
 "annual" INTEGER NOT NULL,
 "currency" TEXT NOT NULL DEFAULT 'USD',
 "features" TEXT[] NOT NULL,
 "stripeMonthlyPriceId" TEXT,
 "stripeAnnualPriceId" TEXT,
 "razorpayMonthlyPlanId" TEXT,
 "razorpayAnnualPlanId" TEXT,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "updatedAt" TIMESTAMP(3) NOT NULL,
 "deletedAt" TIMESTAMP(3)
);

CREATE TABLE "AuditLog" (
 "id" TEXT NOT NULL PRIMARY KEY,
 "actorId" TEXT,
 "action" TEXT NOT NULL,
 "resource" TEXT NOT NULL,
 "resourceId" TEXT,
 "requestId" TEXT,
 "ip" TEXT,
 "details" JSONB NOT NULL DEFAULT '{}',
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "WebhookEvent" (
 "id" TEXT NOT NULL PRIMARY KEY,
 "provider" TEXT NOT NULL,
 "eventId" TEXT NOT NULL,
 "type" TEXT NOT NULL,
 "payloadHash" TEXT NOT NULL,
 "processedAt" TIMESTAMP(3),
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "CookieConsent" (
 "id" TEXT NOT NULL PRIMARY KEY,
 "userId" TEXT,
 "anonymousId" TEXT NOT NULL,
 "necessary" BOOLEAN NOT NULL DEFAULT true,
 "analytics" BOOLEAN NOT NULL DEFAULT false,
 "marketing" BOOLEAN NOT NULL DEFAULT false,
 "version" TEXT NOT NULL,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "OutboxEvent" (
 "id" TEXT NOT NULL PRIMARY KEY,
 "type" TEXT NOT NULL,
 "payload" JSONB NOT NULL,
 "processedAt" TIMESTAMP(3),
 "attempts" INTEGER NOT NULL DEFAULT 0,
 "lastError" TEXT,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "User_role_deletedAt_idx" ON "User" ("role", "deletedAt");
CREATE UNIQUE INDEX "RefreshToken_tokenHash_key" ON "RefreshToken"("tokenHash");
CREATE INDEX "RefreshToken_userId_family_idx" ON "RefreshToken" ("userId", "family");
CREATE UNIQUE INDEX "EmailVerificationToken_tokenHash_key" ON "EmailVerificationToken"("tokenHash");
CREATE UNIQUE INDEX "PasswordResetToken_tokenHash_key" ON "PasswordResetToken"("tokenHash");
CREATE UNIQUE INDEX "OAuthAccount_provider_providerAccountId_key" ON "OAuthAccount" ("provider", "providerAccountId");
CREATE UNIQUE INDEX "BrandProfile_userId_key" ON "BrandProfile"("userId");
CREATE UNIQUE INDEX "TeamMember_brandId_userId_key" ON "TeamMember" ("brandId", "userId");
CREATE UNIQUE INDEX "TeamInvite_tokenHash_key" ON "TeamInvite"("tokenHash");
CREATE INDEX "TeamInvite_brandId_email_idx" ON "TeamInvite" ("brandId", "email");
CREATE UNIQUE INDEX "CreatorProfile_userId_key" ON "CreatorProfile"("userId");
CREATE INDEX "CreatorProfile_country_niche_deletedAt_idx" ON "CreatorProfile" ("country", "niche", "deletedAt");
CREATE UNIQUE INDEX "SocialAccount_platform_handle_key" ON "SocialAccount" ("platform", "handle");
CREATE INDEX "SocialAccount_creatorId_idx" ON "SocialAccount" ("creatorId");
CREATE INDEX "Campaign_brandId_status_deletedAt_createdAt_idx" ON "Campaign" ("brandId", "status", "deletedAt", "createdAt");
CREATE INDEX "Campaign_niche_status_idx" ON "Campaign" ("niche", "status");
CREATE INDEX "Campaign_platforms_idx" ON "Campaign" USING GIN ("platforms");
CREATE INDEX "Campaign_countries_idx" ON "Campaign" USING GIN ("countries");
CREATE INDEX "CampaignDeliverable_campaignId_idx" ON "CampaignDeliverable" ("campaignId");
CREATE UNIQUE INDEX "Application_campaignId_creatorId_key" ON "Application" ("campaignId", "creatorId");
CREATE INDEX "Application_creatorId_status_idx" ON "Application" ("creatorId", "status");
CREATE INDEX "Post_campaignId_status_deletedAt_idx" ON "Post" ("campaignId", "status", "deletedAt");
CREATE INDEX "Post_creatorId_idx" ON "Post" ("creatorId");
CREATE INDEX "PostMetricSnapshot_postId_capturedAt_idx" ON "PostMetricSnapshot" ("postId", "capturedAt");
CREATE UNIQUE INDEX "AnalyticsDaily_campaignId_creatorId_platform_country_date_key" ON "AnalyticsDaily" ("campaignId", "creatorId", "platform", "country", "date");
CREATE INDEX "AnalyticsDaily_brandId_date_idx" ON "AnalyticsDaily" ("brandId", "date");
CREATE INDEX "AnalyticsDaily_creatorId_date_idx" ON "AnalyticsDaily" ("creatorId", "date");
CREATE UNIQUE INDEX "Subscription_providerSubId_key" ON "Subscription"("providerSubId");
CREATE INDEX "Subscription_userId_status_idx" ON "Subscription" ("userId", "status");
CREATE UNIQUE INDEX "Payment_providerPaymentId_key" ON "Payment"("providerPaymentId");
CREATE INDEX "Payment_userId_createdAt_idx" ON "Payment" ("userId", "createdAt");
CREATE UNIQUE INDEX "Invoice_paymentId_key" ON "Invoice"("paymentId");
CREATE UNIQUE INDEX "Invoice_number_key" ON "Invoice"("number");
CREATE UNIQUE INDEX "Wallet_creatorId_key" ON "Wallet"("creatorId");
CREATE UNIQUE INDEX "LedgerEntry_transactionId_account_key" ON "LedgerEntry" ("transactionId", "account");
CREATE INDEX "LedgerEntry_walletId_createdAt_idx" ON "LedgerEntry" ("walletId", "createdAt");
CREATE UNIQUE INDEX "Payout_idempotencyKey_key" ON "Payout"("idempotencyKey");
CREATE UNIQUE INDEX "Payout_providerReference_key" ON "Payout"("providerReference");
CREATE INDEX "Payout_creatorId_status_idx" ON "Payout" ("creatorId", "status");
CREATE UNIQUE INDEX "ConversationParticipant_conversationId_userId_key" ON "ConversationParticipant" ("conversationId", "userId");
CREATE INDEX "ConversationParticipant_userId_idx" ON "ConversationParticipant" ("userId");
CREATE INDEX "Message_conversationId_createdAt_idx" ON "Message" ("conversationId", "createdAt");
CREATE INDEX "Notification_userId_readAt_createdAt_idx" ON "Notification" ("userId", "readAt", "createdAt");
CREATE UNIQUE INDEX "AvailabilitySlot_startsAt_key" ON "AvailabilitySlot"("startsAt");
CREATE UNIQUE INDEX "BookCall_managementTokenHash_key" ON "BookCall"("managementTokenHash");
CREATE INDEX "BookCall_slotId_status_idx" ON "BookCall" ("slotId", "status");
CREATE INDEX "BookCall_email_idx" ON "BookCall" ("email");
CREATE INDEX "Lead_email_source_idx" ON "Lead" ("email", "source");
CREATE UNIQUE INDEX "NewsletterSubscriber_email_key" ON "NewsletterSubscriber"("email");
CREATE UNIQUE INDEX "NewsletterSubscriber_confirmationTokenHash_key" ON "NewsletterSubscriber"("confirmationTokenHash");
CREATE UNIQUE INDEX "NewsletterSubscriber_unsubscribeToken_key" ON "NewsletterSubscriber"("unsubscribeToken");
CREATE UNIQUE INDEX "MediaAsset_key_key" ON "MediaAsset"("key");
CREATE INDEX "MediaAsset_section_showcase_order_idx" ON "MediaAsset" ("section", "showcase", "order");
CREATE UNIQUE INDEX "PricingPlan_plan_key" ON "PricingPlan"("plan");
CREATE INDEX "AuditLog_actorId_createdAt_idx" ON "AuditLog" ("actorId", "createdAt");
CREATE INDEX "AuditLog_resource_resourceId_idx" ON "AuditLog" ("resource", "resourceId");
CREATE UNIQUE INDEX "WebhookEvent_provider_eventId_key" ON "WebhookEvent" ("provider", "eventId");
CREATE INDEX "CookieConsent_anonymousId_createdAt_idx" ON "CookieConsent" ("anonymousId", "createdAt");
CREATE INDEX "OutboxEvent_processedAt_createdAt_idx" ON "OutboxEvent" ("processedAt", "createdAt");
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "EmailVerificationToken" ADD CONSTRAINT "EmailVerificationToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OAuthAccount" ADD CONSTRAINT "OAuthAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BrandProfile" ADD CONSTRAINT "BrandProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "BrandProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TeamInvite" ADD CONSTRAINT "TeamInvite_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "BrandProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CreatorProfile" ADD CONSTRAINT "CreatorProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SocialAccount" ADD CONSTRAINT "SocialAccount_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "CreatorProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "BrandProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CampaignDeliverable" ADD CONSTRAINT "CampaignDeliverable_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Application" ADD CONSTRAINT "Application_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Application" ADD CONSTRAINT "Application_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "CreatorProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Post" ADD CONSTRAINT "Post_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Post" ADD CONSTRAINT "Post_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "CreatorProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Post" ADD CONSTRAINT "Post_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PostMetricSnapshot" ADD CONSTRAINT "PostMetricSnapshot_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AnalyticsDaily" ADD CONSTRAINT "AnalyticsDaily_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Wallet" ADD CONSTRAINT "Wallet_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "CreatorProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Payout" ADD CONSTRAINT "Payout_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "CreatorProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ConversationParticipant" ADD CONSTRAINT "ConversationParticipant_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ConversationParticipant" ADD CONSTRAINT "ConversationParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BookCall" ADD CONSTRAINT "BookCall_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "AvailabilitySlot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BookCall" ADD CONSTRAINT "BookCall_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CookieConsent" ADD CONSTRAINT "CookieConsent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE UNIQUE INDEX "BookCall_one_active_per_slot" ON "BookCall"("slotId") WHERE "status" = 'CONFIRMED' AND "deletedAt" IS NULL;
ALTER TABLE "Wallet" ADD CONSTRAINT "Wallet_nonnegative" CHECK ("availableMinor" >= 0 AND "reservedMinor" >= 0);
ALTER TABLE "Payout" ADD CONSTRAINT "Payout_positive" CHECK ("amountMinor" > 0);
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_budget_positive" CHECK ("budget" > 0);
ALTER TABLE "CampaignDeliverable" ADD CONSTRAINT "Deliverable_reward_nonnegative" CHECK ("rewardMinor" >= 0 AND "quantity" > 0);
ALTER TABLE "Application" ADD CONSTRAINT "Application_reward_nonnegative" CHECK ("rewardMinor" >= 0);
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_refund_bounds" CHECK ("amountMinor" >= 0 AND "refundedMinor" >= 0 AND "refundedMinor" <= "amountMinor");
ALTER TABLE "AvailabilitySlot" ADD CONSTRAINT "AvailabilitySlot_interval" CHECK ("endsAt" > "startsAt");
ALTER TABLE "AvailabilitySlot" ADD CONSTRAINT "AvailabilitySlot_no_overlap" EXCLUDE USING gist (tsrange("startsAt", "endsAt", '[)') WITH &&) WHERE ("enabled" = true AND "deletedAt" IS NULL);
CREATE FUNCTION assert_ledger_balanced() RETURNS TRIGGER AS $$
DECLARE target TEXT;
BEGIN
 IF TG_OP IN ('UPDATE', 'DELETE') THEN
   target := OLD."transactionId";
   IF (SELECT COALESCE(SUM("amountMinor"),0) FROM "LedgerEntry" WHERE "transactionId" = target) <> 0 THEN
     RAISE EXCEPTION 'Unbalanced ledger transaction %', target;
   END IF;
 END IF;
 IF TG_OP IN ('INSERT', 'UPDATE') THEN
   target := NEW."transactionId";
   IF (SELECT COALESCE(SUM("amountMinor"),0) FROM "LedgerEntry" WHERE "transactionId" = target) <> 0 THEN
     RAISE EXCEPTION 'Unbalanced ledger transaction %', target;
   END IF;
 END IF;
 RETURN NULL;
END;
$$ LANGUAGE plpgsql;
CREATE CONSTRAINT TRIGGER "LedgerEntry_balanced" AFTER INSERT OR UPDATE OR DELETE ON "LedgerEntry" DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION assert_ledger_balanced();

CREATE TABLE "Refund" ("id" TEXT PRIMARY KEY, "paymentId" TEXT NOT NULL, "idempotencyKey" TEXT NOT NULL, "providerRefundId" TEXT, "amountMinor" INTEGER NOT NULL, "reason" TEXT NOT NULL, "status" TEXT NOT NULL DEFAULT 'REQUESTED', "attemptedAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL);
CREATE UNIQUE INDEX "Refund_idempotencyKey_key" ON "Refund"("idempotencyKey");
CREATE UNIQUE INDEX "Refund_providerRefundId_key" ON "Refund"("providerRefundId");
CREATE INDEX "Refund_paymentId_status_idx" ON "Refund"("paymentId","status");
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_positive" CHECK ("amountMinor">0);
CREATE TABLE "RevenueEvent" ("id" TEXT PRIMARY KEY,"campaignId" TEXT NOT NULL,"eventId" TEXT NOT NULL,"revenueMinor" INTEGER NOT NULL,"spendMinor" INTEGER NOT NULL,"currency" TEXT NOT NULL,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" TIMESTAMP(3) NOT NULL);
CREATE UNIQUE INDEX "RevenueEvent_eventId_key" ON "RevenueEvent"("eventId");
CREATE INDEX "RevenueEvent_campaignId_createdAt_idx" ON "RevenueEvent"("campaignId","createdAt");
ALTER TABLE "RevenueEvent" ADD CONSTRAINT "RevenueEvent_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "RevenueEvent" ADD CONSTRAINT "RevenueEvent_nonnegative" CHECK ("revenueMinor">=0 AND "spendMinor">=0);

CREATE TABLE "CheckoutAttempt" ("id" TEXT PRIMARY KEY,"userId" TEXT NOT NULL,"idempotencyKey" TEXT NOT NULL,"requestHash" TEXT NOT NULL,"provider" TEXT NOT NULL,"status" TEXT NOT NULL DEFAULT 'PROCESSING',"response" JSONB,"lastError" TEXT,"expiresAt" TIMESTAMP(3) NOT NULL,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" TIMESTAMP(3) NOT NULL);
CREATE UNIQUE INDEX "CheckoutAttempt_userId_idempotencyKey_key" ON "CheckoutAttempt"("userId","idempotencyKey");
CREATE INDEX "CheckoutAttempt_userId_status_idx" ON "CheckoutAttempt"("userId","status");
CREATE UNIQUE INDEX "CheckoutAttempt_one_unresolved" ON "CheckoutAttempt"("userId") WHERE "status" IN ('PROCESSING','CHECKOUT_CREATED','RECONCILE_REQUIRED');
ALTER TABLE "CheckoutAttempt" ADD CONSTRAINT "CheckoutAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Post" ADD COLUMN "latestViews" INTEGER NOT NULL DEFAULT 0;
CREATE INDEX "Post_deletedAt_latestViews_idx" ON "Post"("deletedAt","latestViews");

ALTER TABLE "BrandProfile" ADD COLUMN "gstin" TEXT, ADD COLUMN "billingName" TEXT, ADD COLUMN "billingAddress" TEXT;
