# Schema source audit

Source inspection only; no Prisma validation, SQL execution or database introspection is claimed. Migration order: 20261111000000_initial, 20261113000000_user_integrity. Counts compare declared scalar fields, nullability and named foreign keys against checked-in SQL. Index/unique counts describe Prisma declarations, not verified database objects. Custom SQL constraints require real PostgreSQL tests.

| Model | Scalar fields | Nullable | Declared foreign keys | Unique declarations | Index declarations |
|---|---|---|---|---|---|
| User | 15 | 7 | 0 | 1 | 1 |
| RefreshToken | 9 | 2 | 1 | 1 | 1 |
| EmailVerificationToken | 7 | 1 | 1 | 1 | 0 |
| PasswordResetToken | 7 | 1 | 1 | 1 | 0 |
| OAuthAccount | 6 | 0 | 1 | 1 | 0 |
| BrandProfile | 15 | 5 | 1 | 1 | 0 |
| TeamMember | 7 | 1 | 2 | 1 | 1 |
| TeamInvite | 9 | 1 | 1 | 1 | 1 |
| CreatorProfile | 14 | 3 | 1 | 1 | 1 |
| SocialAccount | 13 | 5 | 1 | 1 | 1 |
| Campaign | 16 | 3 | 1 | 0 | 4 |
| CampaignDeliverable | 9 | 1 | 1 | 0 | 1 |
| Application | 10 | 1 | 2 | 1 | 1 |
| Post | 15 | 5 | 3 | 0 | 3 |
| PostMetricSnapshot | 10 | 0 | 1 | 0 | 1 |
| AnalyticsDaily | 16 | 0 | 1 | 1 | 2 |
| Subscription | 12 | 5 | 1 | 1 | 1 |
| Payment | 12 | 2 | 2 | 1 | 1 |
| Invoice | 12 | 4 | 1 | 2 | 0 |
| Wallet | 7 | 0 | 1 | 1 | 0 |
| LedgerEntry | 8 | 0 | 1 | 1 | 1 |
| Payout | 12 | 3 | 1 | 2 | 1 |
| Conversation | 4 | 1 | 0 | 0 | 0 |
| ConversationParticipant | 7 | 2 | 2 | 1 | 1 |
| Message | 9 | 2 | 2 | 0 | 1 |
| Notification | 10 | 3 | 1 | 0 | 1 |
| AvailabilitySlot | 7 | 1 | 0 | 1 | 0 |
| BookCall | 15 | 5 | 2 | 1 | 2 |
| Lead | 13 | 7 | 0 | 0 | 1 |
| ContactMessage | 8 | 1 | 0 | 0 | 0 |
| NewsletterSubscriber | 10 | 2 | 0 | 3 | 0 |
| MediaAsset | 18 | 6 | 1 | 1 | 1 |
| SiteStat | 7 | 0 | 0 | 0 | 0 |
| Testimonial | 12 | 1 | 0 | 0 | 0 |
| FAQ | 7 | 1 | 0 | 0 | 0 |
| PricingPlan | 14 | 5 | 0 | 1 | 0 |
| AuditLog | 10 | 4 | 1 | 0 | 2 |
| WebhookEvent | 8 | 1 | 0 | 1 | 0 |
| CookieConsent | 9 | 1 | 1 | 0 | 1 |
| OutboxEvent | 8 | 2 | 0 | 0 | 1 |
| Refund | 10 | 2 | 1 | 2 | 1 |
| RevenueEvent | 8 | 0 | 1 | 1 | 1 |
| CheckoutAttempt | 11 | 2 | 1 | 1 | 1 |

Findings: No column/nullability/named-FK mismatches detected by this source scanner.

AnalyticsDaily brandId/creatorId are denormalized dimensions; creatorId can be an empty campaign-level sentinel. Campaign is the authoritative FK/scope. TeamMember.userId and Payment.userId now have explicit User relations and restrictive FKs in the second migration. Existing orphans cause migration failure for explicit repair; no data is silently deleted. Prisma connection pooling, hot-query plans, uniqueness/exclusion behavior, money transactions and recovery remain unverified against PostgreSQL.
