# Route inventory

| Method | Path | Roles | Purpose |
|---|---|---|---|
| GET | /api/v1/auth/csrf | Public | Get double-submit CSRF token for native cookie clients |
| POST | /api/v1/auth/google/exchange | Public | Consume one-time OAuth exchange code |
| POST | /api/v1/auth/signup | Public | Register a brand or creator |
| POST | /api/v1/auth/login | Public | Login |
| GET | /api/v1/auth/me | Authenticated | Current account |
| POST | /api/v1/auth/refresh | Public | Rotate refresh token |
| POST | /api/v1/auth/logout | Authenticated | Logout |
| POST | /api/v1/auth/logout-all | Authenticated | Revoke all sessions |
| POST | /api/v1/auth/forgot-password | Public | forgot-password |
| POST | /api/v1/auth/resend-verification | Public | resend-verification |
| POST | /api/v1/auth/reset-password | Public | Reset password |
| POST | /api/v1/auth/verify-email | Public | Verify email |
| POST | /api/v1/auth/change-password | Authenticated | Change password and revoke sessions |
| GET | /api/v1/auth/google | Public | Begin Google OAuth with PKCE |
| GET | /api/v1/auth/google/callback | Public | Google callback |
| PATCH | /api/v1/brand/billing | BRAND | Update brand invoice billing details |
| PATCH | /api/v1/brand/profile | BRAND | Update own brand profile |
| GET | /api/v1/creators/:id/profile | Authenticated | Creator public collaboration profile |
| GET | /api/v1/brand/profile | BRAND | get brand profile / onboarding |
| POST | /api/v1/brand/onboarding | BRAND | post brand profile / onboarding |
| PATCH | /api/v1/brand/onboarding | BRAND | patch brand profile / onboarding |
| DELETE | /api/v1/brand/profile | BRAND | delete brand profile / onboarding |
| GET | /api/v1/brand/team | BRAND | Team members and pending invites |
| POST | /api/v1/brand/team/invites | BRAND | Invite team member |
| POST | /api/v1/brand/team/accept | Authenticated | Accept team invitation |
| DELETE | /api/v1/brand/team/:id | BRAND | Remove team member |
| GET | /api/v1/campaigns | Authenticated | Accessible campaigns |
| GET | /api/v1/campaigns/marketplace | Public | Public live campaigns |
| POST | /api/v1/campaigns | BRAND | Create campaign brief |
| POST | /api/v1/brand/jobs | BRAND | Create campaign brief |
| GET | /api/v1/campaigns/:id | Authenticated | Campaign detail |
| PATCH | /api/v1/campaigns/:id | BRAND, ADMIN, SUPERADMIN | Edit campaign |
| DELETE | /api/v1/campaigns/:id | BRAND, ADMIN, SUPERADMIN | Soft delete campaign |
| POST | /api/v1/campaigns/:id/duplicate | BRAND | Duplicate campaign as draft |
| POST | /api/v1/campaigns/:id/deliverables | BRAND | Add campaign deliverable |
| GET | /api/v1/creators | Authenticated | Creator discovery directory |
| GET | /api/v1/creators/me | CREATOR | get creator profile |
| PATCH | /api/v1/creators/me | CREATOR | patch creator profile |
| DELETE | /api/v1/creators/me | CREATOR | delete creator profile |
| POST | /api/v1/creators/onboarding | CREATOR | Complete creator onboarding |
| PATCH | /api/v1/creators/payout-details | CREATOR | Encrypt creator payout details |
| POST | /api/v1/campaigns/:id/applications | CREATOR | Apply to a live campaign |
| GET | /api/v1/applications | Authenticated | Owned applications |
| POST | /api/v1/applications/:id/withdraw | CREATOR | Withdraw own application |
| PATCH | /api/v1/applications/:id | BRAND, ADMIN, SUPERADMIN | Review applicant and agree reward |
| POST | /api/v1/content | CREATOR | Submit content for an accepted application |
| GET | /api/v1/content | Authenticated | Owned campaign content |
| PATCH | /api/v1/content/:id/review | BRAND, ADMIN, SUPERADMIN | Approve, reject or request content revisions |
| PATCH | /api/v1/content/:id | CREATOR | Resubmit revised content or mark approved content live |
| POST | /api/v1/campaigns/:id/revenue | BRAND, ADMIN, SUPERADMIN | Idempotent attributed revenue/spend ingestion for ROI |
| GET | /api/v1/analytics | Authenticated | Dashboard Views / Engagement / ROI |
| GET | /api/v1/analytics/export | Authenticated | CSV or PDF analytics export |
| GET | /api/v1/analytics/top-posts | Authenticated | Top owned posts by latest views |
| GET | /api/v1/analytics/leaderboard | Authenticated | Creator leaderboard for owned campaign analytics |
| POST | /api/v1/creators/socials | CREATOR | Link a social profile with expiring bio verification |
| GET | /api/v1/creators/socials | CREATOR | List own linked social accounts |
| POST | /api/v1/creators/socials/:id/verify | CREATOR | Verify code from provider bio |
| DELETE | /api/v1/creators/socials/:id | CREATOR | Unlink own social account |
| POST | /api/v1/media/upload | Authenticated | Create short-lived signed quarantine upload URL |
| POST | /api/v1/media/:id/complete | Authenticated | Validate upload and queue media scan/thumbnail |
| GET | /api/v1/media/:id | Authenticated | Read owned media processing status / signed download |
| DELETE | /api/v1/media/:id | Authenticated | Soft delete owned media |
| POST | /api/v1/payments/checkout | BRAND | Create provider checkout with remaining trial |
| GET | /api/v1/subscriptions/me | Authenticated | Current subscription and trial |
| POST | /api/v1/subscriptions/cancel | BRAND | Cancel at current billing period end |
| PATCH | /api/v1/subscriptions/plan | BRAND | Change self-service billing interval at provider |
| POST | /api/v1/payments/portal | BRAND | Stripe billing portal to update payment method |
| GET | /api/v1/invoices | Authenticated | Own invoices |
| GET | /api/v1/invoices/:id/pdf | Authenticated | Download owned invoice PDF |
| POST | /api/v1/admin/payments/:id/refund | ADMIN, SUPERADMIN | Reserve and queue an idempotent provider refund |
| GET | /api/v1/creators/earnings | CREATOR | Creator wallet and earnings ledger |
| POST | /api/v1/payouts | CREATOR | Reserve creator balance for payout |
| GET | /api/v1/payouts | CREATOR | Own creator payouts |
| PATCH | /api/v1/admin/payouts/:id | ADMIN, SUPERADMIN | Approve / process / reconcile payout settlement |
| GET | /api/v1/conversations | Authenticated | Own conversations with unread counts |
| POST | /api/v1/conversations | Authenticated | Create conversation with a campaign collaborator |
| GET | /api/v1/conversations/:id/messages | Authenticated | Paginated participant message history |
| POST | /api/v1/conversations/:id/messages | Authenticated | Send message (REST fallback) |
| POST | /api/v1/conversations/:id/read | Authenticated | Mark conversation read |
| GET | /api/v1/conversations/:id/presence | Authenticated | Presence of fellow conversation participants |
| GET | /api/v1/notifications | Authenticated | Own in-app notifications |
| PATCH | /api/v1/notifications/:id/read | Authenticated | Mark own notification read |
| POST | /api/v1/notifications/read-all | Authenticated | Mark all own notifications read |
| PATCH | /api/v1/notifications/preferences | Authenticated | Update in-app/email notification preferences |
| POST | /api/v1/contact | Public | Public contact form |
| POST | /api/v1/creators/apply | Public | Public creator interest form |
| POST | /api/v1/leads | Public | Capture lead with UTM attribution |
| POST | /api/v1/newsletter | Public | Newsletter double opt-in request |
| POST | /api/v1/newsletter/confirm | Public | Confirm newsletter opt-in |
| POST | /api/v1/newsletter/unsubscribe | Public | Unsubscribe using opaque email token |
| GET | /api/v1/testimonials | Public | Public testimonials |
| GET | /api/v1/faq | Public | Public faq |
| GET | /api/v1/pricing | Public | Public pricing |
| GET | /api/v1/countries | Public | Supported country choices |
| GET | /api/v1/stats | Public | Live site stats |
| GET | /api/v1/media/showcase | Public | Managed assets matching assets.ts |
| GET | /api/v1/sitemap | Public | Public sitemap data |
| GET | /api/v1/bookings/slots | Public | Available times on a date in IANA timezone |
| POST | /api/v1/bookings | Public | Atomically reserve an available call slot |
| POST | /api/v1/bookings/:id/cancel | Public | Cancel call using private management token |
| POST | /api/v1/bookings/:id/reschedule | Public | Reschedule call using private management token |
| GET | /api/v1/admin/payouts/:id/details | ADMIN, SUPERADMIN | Audited finance access to encrypted payout destination |
| GET | /api/v1/admin/checkouts | ADMIN, SUPERADMIN | Inspect unresolved provider checkout attempts |
| PATCH | /api/v1/admin/checkouts/:id/reconcile | SUPERADMIN | SuperAdmin attests no provider object exists after reconciliation |
| GET | /api/v1/admin/users | ADMIN, SUPERADMIN | Admin user directory |
| PATCH | /api/v1/admin/users/:id/status | ADMIN, SUPERADMIN | Ban/unban with session revocation and audit |
| POST | /api/v1/admin/users/:id/impersonate | SUPERADMIN | SuperAdmin creates audited read-only impersonation session |
| GET | /api/v1/admin/creators/verification | ADMIN, SUPERADMIN | Creator verification queue |
| PATCH | /api/v1/admin/creators/:id/verify | ADMIN, SUPERADMIN | Approve creator verification |
| GET | /api/v1/admin/metrics | ADMIN, SUPERADMIN | Platform revenue and operational metrics |
| GET | /api/v1/admin/leads | ADMIN, SUPERADMIN | Admin leads management list |
| GET | /api/v1/admin/contacts | ADMIN, SUPERADMIN | Admin contacts management list |
| GET | /api/v1/admin/calls | ADMIN, SUPERADMIN | Admin calls management list |
| GET | /api/v1/admin/payouts | ADMIN, SUPERADMIN | Admin payouts management list |
| GET | /api/v1/admin/audit | ADMIN, SUPERADMIN | Admin audit management list |
| GET | /api/v1/admin/content | ADMIN, SUPERADMIN | Admin content management list |
| GET | /api/v1/admin/campaigns | ADMIN, SUPERADMIN | Admin campaigns management list |
| PATCH | /api/v1/admin/contacts/:id | ADMIN, SUPERADMIN | Mark contact message in progress/resolved |
| DELETE | /api/v1/admin/leads/:id | ADMIN, SUPERADMIN | Soft delete a lead |
| PATCH | /api/v1/admin/calls/:id | ADMIN, SUPERADMIN | Manage booking and meeting link |
| GET | /api/v1/admin/availability | ADMIN, SUPERADMIN | Admin availability slots |
| POST | /api/v1/admin/availability | ADMIN, SUPERADMIN | Create explicit availability slot |
| PATCH | /api/v1/admin/availability/:id | ADMIN, SUPERADMIN | Enable/disable availability |
| POST | /api/v1/admin/site/testimonials | ADMIN, SUPERADMIN | post managed testimonials |
| PATCH | /api/v1/admin/site/testimonials/:id | ADMIN, SUPERADMIN | patch managed testimonials |
| DELETE | /api/v1/admin/site/testimonials/:id | ADMIN, SUPERADMIN | delete managed testimonials |
| POST | /api/v1/admin/site/faq | ADMIN, SUPERADMIN | post managed faq |
| PATCH | /api/v1/admin/site/faq/:id | ADMIN, SUPERADMIN | patch managed faq |
| DELETE | /api/v1/admin/site/faq/:id | ADMIN, SUPERADMIN | delete managed faq |
| POST | /api/v1/admin/site/pricing | ADMIN, SUPERADMIN | post managed pricing |
| PATCH | /api/v1/admin/site/pricing/:id | ADMIN, SUPERADMIN | patch managed pricing |
| DELETE | /api/v1/admin/site/pricing/:id | ADMIN, SUPERADMIN | delete managed pricing |
| PATCH | /api/v1/admin/site/stats | ADMIN, SUPERADMIN | Save editorial site counters |
| GET | /api/v1/admin/media | ADMIN, SUPERADMIN | Manage all media/showcase assets |
| PATCH | /api/v1/admin/media/:id | ADMIN, SUPERADMIN | Replace showcase asset metadata without frontend code changes |
| POST | /api/v1/compliance/consent | Public | Append cookie-consent decision |
| POST | /api/v1/compliance/terms | Authenticated | Record current terms/privacy acceptance |
| GET | /api/v1/compliance/export | Authenticated | Export own personal data (GDPR/DPDP) |
| DELETE | /api/v1/compliance/account | Authenticated | Reauthenticate, anonymize personal data and revoke sessions |
