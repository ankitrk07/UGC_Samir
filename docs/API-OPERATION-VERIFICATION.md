# API operation execution status

Per-operation real API execution evidence is not available. These are execution statuses, not route-declaration checks. There are 139 registered routes plus 2 raw-body provider webhook operations (141 total). All success, auth, validation and ownership checks below remain open. NOT_RUN means the backend suite did not execute; NOT_TRACKED means a suite ran but no per-operation evidence was collected.

| Method | Path | Access | Success | Auth / RBAC | Validation / ownership |
|---|---|---|---|---|---|
| GET | /api/v1/auth/csrf | Public / provider signature | NOT_RUN | NOT_RUN | NOT_RUN |
| POST | /api/v1/auth/google/exchange | Public / provider signature | NOT_RUN | NOT_RUN | NOT_RUN |
| POST | /api/v1/auth/signup | Public / provider signature | NOT_RUN | NOT_RUN | NOT_RUN |
| POST | /api/v1/auth/login | Public / provider signature | NOT_RUN | NOT_RUN | NOT_RUN |
| GET | /api/v1/auth/me | Authenticated | NOT_RUN | NOT_RUN | NOT_RUN |
| POST | /api/v1/auth/refresh | Public / provider signature | NOT_RUN | NOT_RUN | NOT_RUN |
| POST | /api/v1/auth/logout | Authenticated | NOT_RUN | NOT_RUN | NOT_RUN |
| POST | /api/v1/auth/logout-all | Authenticated | NOT_RUN | NOT_RUN | NOT_RUN |
| POST | /api/v1/auth/forgot-password | Public / provider signature | NOT_RUN | NOT_RUN | NOT_RUN |
| POST | /api/v1/auth/resend-verification | Public / provider signature | NOT_RUN | NOT_RUN | NOT_RUN |
| POST | /api/v1/auth/reset-password | Public / provider signature | NOT_RUN | NOT_RUN | NOT_RUN |
| POST | /api/v1/auth/verify-email | Public / provider signature | NOT_RUN | NOT_RUN | NOT_RUN |
| POST | /api/v1/auth/change-password | Authenticated | NOT_RUN | NOT_RUN | NOT_RUN |
| GET | /api/v1/auth/google | Public / provider signature | NOT_RUN | NOT_RUN | NOT_RUN |
| GET | /api/v1/auth/google/callback | Public / provider signature | NOT_RUN | NOT_RUN | NOT_RUN |
| PATCH | /api/v1/brand/billing | BRAND | NOT_RUN | NOT_RUN | NOT_RUN |
| PATCH | /api/v1/brand/profile | BRAND | NOT_RUN | NOT_RUN | NOT_RUN |
| GET | /api/v1/brand/profile | BRAND | NOT_RUN | NOT_RUN | NOT_RUN |
| DELETE | /api/v1/brand/profile | BRAND | NOT_RUN | NOT_RUN | NOT_RUN |
| GET | /api/v1/creators/{id}/profile | Authenticated | NOT_RUN | NOT_RUN | NOT_RUN |
| POST | /api/v1/brand/onboarding | BRAND | NOT_RUN | NOT_RUN | NOT_RUN |
| PATCH | /api/v1/brand/onboarding | BRAND | NOT_RUN | NOT_RUN | NOT_RUN |
| GET | /api/v1/brand/team | BRAND | NOT_RUN | NOT_RUN | NOT_RUN |
| POST | /api/v1/brand/team/invites | BRAND | NOT_RUN | NOT_RUN | NOT_RUN |
| POST | /api/v1/brand/team/accept | Authenticated | NOT_RUN | NOT_RUN | NOT_RUN |
| DELETE | /api/v1/brand/team/{id} | BRAND | NOT_RUN | NOT_RUN | NOT_RUN |
| GET | /api/v1/campaigns | Authenticated | NOT_RUN | NOT_RUN | NOT_RUN |
| POST | /api/v1/campaigns | BRAND | NOT_RUN | NOT_RUN | NOT_RUN |
| GET | /api/v1/campaigns/marketplace | Public / provider signature | NOT_RUN | NOT_RUN | NOT_RUN |
| POST | /api/v1/brand/jobs | BRAND | NOT_RUN | NOT_RUN | NOT_RUN |
| GET | /api/v1/campaigns/{id} | Authenticated | NOT_RUN | NOT_RUN | NOT_RUN |
| PATCH | /api/v1/campaigns/{id} | BRAND, ADMIN, SUPERADMIN | NOT_RUN | NOT_RUN | NOT_RUN |
| DELETE | /api/v1/campaigns/{id} | BRAND, ADMIN, SUPERADMIN | NOT_RUN | NOT_RUN | NOT_RUN |
| POST | /api/v1/campaigns/{id}/duplicate | BRAND | NOT_RUN | NOT_RUN | NOT_RUN |
| POST | /api/v1/campaigns/{id}/deliverables | BRAND | NOT_RUN | NOT_RUN | NOT_RUN |
| GET | /api/v1/creators | Authenticated | NOT_RUN | NOT_RUN | NOT_RUN |
| GET | /api/v1/creators/me | CREATOR | NOT_RUN | NOT_RUN | NOT_RUN |
| PATCH | /api/v1/creators/me | CREATOR | NOT_RUN | NOT_RUN | NOT_RUN |
| DELETE | /api/v1/creators/me | CREATOR | NOT_RUN | NOT_RUN | NOT_RUN |
| POST | /api/v1/creators/onboarding | CREATOR | NOT_RUN | NOT_RUN | NOT_RUN |
| PATCH | /api/v1/creators/payout-details | CREATOR | NOT_RUN | NOT_RUN | NOT_RUN |
| POST | /api/v1/campaigns/{id}/applications | CREATOR | NOT_RUN | NOT_RUN | NOT_RUN |
| GET | /api/v1/applications | Authenticated | NOT_RUN | NOT_RUN | NOT_RUN |
| POST | /api/v1/applications/{id}/withdraw | CREATOR | NOT_RUN | NOT_RUN | NOT_RUN |
| PATCH | /api/v1/applications/{id} | BRAND, ADMIN, SUPERADMIN | NOT_RUN | NOT_RUN | NOT_RUN |
| POST | /api/v1/content | CREATOR | NOT_RUN | NOT_RUN | NOT_RUN |
| GET | /api/v1/content | Authenticated | NOT_RUN | NOT_RUN | NOT_RUN |
| PATCH | /api/v1/content/{id}/review | BRAND, ADMIN, SUPERADMIN | NOT_RUN | NOT_RUN | NOT_RUN |
| PATCH | /api/v1/content/{id} | CREATOR | NOT_RUN | NOT_RUN | NOT_RUN |
| POST | /api/v1/campaigns/{id}/revenue | BRAND, ADMIN, SUPERADMIN | NOT_RUN | NOT_RUN | NOT_RUN |
| GET | /api/v1/analytics | Authenticated | NOT_RUN | NOT_RUN | NOT_RUN |
| GET | /api/v1/analytics/export | Authenticated | NOT_RUN | NOT_RUN | NOT_RUN |
| GET | /api/v1/analytics/top-posts | Authenticated | NOT_RUN | NOT_RUN | NOT_RUN |
| GET | /api/v1/analytics/leaderboard | Authenticated | NOT_RUN | NOT_RUN | NOT_RUN |
| POST | /api/v1/creators/socials | CREATOR | NOT_RUN | NOT_RUN | NOT_RUN |
| GET | /api/v1/creators/socials | CREATOR | NOT_RUN | NOT_RUN | NOT_RUN |
| POST | /api/v1/creators/socials/{id}/verify | CREATOR | NOT_RUN | NOT_RUN | NOT_RUN |
| DELETE | /api/v1/creators/socials/{id} | CREATOR | NOT_RUN | NOT_RUN | NOT_RUN |
| POST | /api/v1/media/upload | Authenticated | NOT_RUN | NOT_RUN | NOT_RUN |
| POST | /api/v1/media/{id}/complete | Authenticated | NOT_RUN | NOT_RUN | NOT_RUN |
| GET | /api/v1/media/{id} | Authenticated | NOT_RUN | NOT_RUN | NOT_RUN |
| DELETE | /api/v1/media/{id} | Authenticated | NOT_RUN | NOT_RUN | NOT_RUN |
| POST | /api/v1/payments/checkout | BRAND | NOT_RUN | NOT_RUN | NOT_RUN |
| GET | /api/v1/subscriptions/me | Authenticated | NOT_RUN | NOT_RUN | NOT_RUN |
| POST | /api/v1/subscriptions/cancel | BRAND | NOT_RUN | NOT_RUN | NOT_RUN |
| PATCH | /api/v1/subscriptions/plan | BRAND | NOT_RUN | NOT_RUN | NOT_RUN |
| POST | /api/v1/payments/portal | BRAND | NOT_RUN | NOT_RUN | NOT_RUN |
| GET | /api/v1/invoices | Authenticated | NOT_RUN | NOT_RUN | NOT_RUN |
| GET | /api/v1/invoices/{id}/pdf | Authenticated | NOT_RUN | NOT_RUN | NOT_RUN |
| POST | /api/v1/admin/payments/{id}/refund | ADMIN, SUPERADMIN | NOT_RUN | NOT_RUN | NOT_RUN |
| GET | /api/v1/creators/earnings | CREATOR | NOT_RUN | NOT_RUN | NOT_RUN |
| POST | /api/v1/payouts | CREATOR | NOT_RUN | NOT_RUN | NOT_RUN |
| GET | /api/v1/payouts | CREATOR | NOT_RUN | NOT_RUN | NOT_RUN |
| PATCH | /api/v1/admin/payouts/{id} | ADMIN, SUPERADMIN | NOT_RUN | NOT_RUN | NOT_RUN |
| GET | /api/v1/conversations | Authenticated | NOT_RUN | NOT_RUN | NOT_RUN |
| POST | /api/v1/conversations | Authenticated | NOT_RUN | NOT_RUN | NOT_RUN |
| GET | /api/v1/conversations/{id}/messages | Authenticated | NOT_RUN | NOT_RUN | NOT_RUN |
| POST | /api/v1/conversations/{id}/messages | Authenticated | NOT_RUN | NOT_RUN | NOT_RUN |
| POST | /api/v1/conversations/{id}/read | Authenticated | NOT_RUN | NOT_RUN | NOT_RUN |
| GET | /api/v1/conversations/{id}/presence | Authenticated | NOT_RUN | NOT_RUN | NOT_RUN |
| GET | /api/v1/notifications | Authenticated | NOT_RUN | NOT_RUN | NOT_RUN |
| PATCH | /api/v1/notifications/{id}/read | Authenticated | NOT_RUN | NOT_RUN | NOT_RUN |
| POST | /api/v1/notifications/read-all | Authenticated | NOT_RUN | NOT_RUN | NOT_RUN |
| PATCH | /api/v1/notifications/preferences | Authenticated | NOT_RUN | NOT_RUN | NOT_RUN |
| POST | /api/v1/contact | Public / provider signature | NOT_RUN | NOT_RUN | NOT_RUN |
| POST | /api/v1/creators/apply | Public / provider signature | NOT_RUN | NOT_RUN | NOT_RUN |
| POST | /api/v1/leads | Public / provider signature | NOT_RUN | NOT_RUN | NOT_RUN |
| POST | /api/v1/newsletter | Public / provider signature | NOT_RUN | NOT_RUN | NOT_RUN |
| POST | /api/v1/newsletter/confirm | Public / provider signature | NOT_RUN | NOT_RUN | NOT_RUN |
| POST | /api/v1/newsletter/unsubscribe | Public / provider signature | NOT_RUN | NOT_RUN | NOT_RUN |
| GET | /api/v1/testimonials | Public / provider signature | NOT_RUN | NOT_RUN | NOT_RUN |
| GET | /api/v1/faq | Public / provider signature | NOT_RUN | NOT_RUN | NOT_RUN |
| GET | /api/v1/pricing | Public / provider signature | NOT_RUN | NOT_RUN | NOT_RUN |
| GET | /api/v1/countries | Public / provider signature | NOT_RUN | NOT_RUN | NOT_RUN |
| GET | /api/v1/stats | Public / provider signature | NOT_RUN | NOT_RUN | NOT_RUN |
| GET | /api/v1/media/showcase | Public / provider signature | NOT_RUN | NOT_RUN | NOT_RUN |
| GET | /api/v1/sitemap | Public / provider signature | NOT_RUN | NOT_RUN | NOT_RUN |
| GET | /api/v1/bookings/slots | Public / provider signature | NOT_RUN | NOT_RUN | NOT_RUN |
| POST | /api/v1/bookings | Public / provider signature | NOT_RUN | NOT_RUN | NOT_RUN |
| POST | /api/v1/bookings/{id}/cancel | Public / provider signature | NOT_RUN | NOT_RUN | NOT_RUN |
| POST | /api/v1/bookings/{id}/reschedule | Public / provider signature | NOT_RUN | NOT_RUN | NOT_RUN |
| GET | /api/v1/admin/payouts/{id}/details | ADMIN, SUPERADMIN | NOT_RUN | NOT_RUN | NOT_RUN |
| GET | /api/v1/admin/checkouts | ADMIN, SUPERADMIN | NOT_RUN | NOT_RUN | NOT_RUN |
| PATCH | /api/v1/admin/checkouts/{id}/reconcile | SUPERADMIN | NOT_RUN | NOT_RUN | NOT_RUN |
| GET | /api/v1/admin/users | ADMIN, SUPERADMIN | NOT_RUN | NOT_RUN | NOT_RUN |
| PATCH | /api/v1/admin/users/{id}/status | ADMIN, SUPERADMIN | NOT_RUN | NOT_RUN | NOT_RUN |
| POST | /api/v1/admin/users/{id}/impersonate | SUPERADMIN | NOT_RUN | NOT_RUN | NOT_RUN |
| GET | /api/v1/admin/creators/verification | ADMIN, SUPERADMIN | NOT_RUN | NOT_RUN | NOT_RUN |
| PATCH | /api/v1/admin/creators/{id}/verify | ADMIN, SUPERADMIN | NOT_RUN | NOT_RUN | NOT_RUN |
| GET | /api/v1/admin/metrics | ADMIN, SUPERADMIN | NOT_RUN | NOT_RUN | NOT_RUN |
| GET | /api/v1/admin/leads | ADMIN, SUPERADMIN | NOT_RUN | NOT_RUN | NOT_RUN |
| GET | /api/v1/admin/contacts | ADMIN, SUPERADMIN | NOT_RUN | NOT_RUN | NOT_RUN |
| GET | /api/v1/admin/calls | ADMIN, SUPERADMIN | NOT_RUN | NOT_RUN | NOT_RUN |
| GET | /api/v1/admin/payouts | ADMIN, SUPERADMIN | NOT_RUN | NOT_RUN | NOT_RUN |
| GET | /api/v1/admin/audit | ADMIN, SUPERADMIN | NOT_RUN | NOT_RUN | NOT_RUN |
| GET | /api/v1/admin/content | ADMIN, SUPERADMIN | NOT_RUN | NOT_RUN | NOT_RUN |
| GET | /api/v1/admin/campaigns | ADMIN, SUPERADMIN | NOT_RUN | NOT_RUN | NOT_RUN |
| PATCH | /api/v1/admin/contacts/{id} | ADMIN, SUPERADMIN | NOT_RUN | NOT_RUN | NOT_RUN |
| DELETE | /api/v1/admin/leads/{id} | ADMIN, SUPERADMIN | NOT_RUN | NOT_RUN | NOT_RUN |
| PATCH | /api/v1/admin/calls/{id} | ADMIN, SUPERADMIN | NOT_RUN | NOT_RUN | NOT_RUN |
| GET | /api/v1/admin/availability | ADMIN, SUPERADMIN | NOT_RUN | NOT_RUN | NOT_RUN |
| POST | /api/v1/admin/availability | ADMIN, SUPERADMIN | NOT_RUN | NOT_RUN | NOT_RUN |
| PATCH | /api/v1/admin/availability/{id} | ADMIN, SUPERADMIN | NOT_RUN | NOT_RUN | NOT_RUN |
| POST | /api/v1/admin/site/testimonials | ADMIN, SUPERADMIN | NOT_RUN | NOT_RUN | NOT_RUN |
| PATCH | /api/v1/admin/site/testimonials/{id} | ADMIN, SUPERADMIN | NOT_RUN | NOT_RUN | NOT_RUN |
| DELETE | /api/v1/admin/site/testimonials/{id} | ADMIN, SUPERADMIN | NOT_RUN | NOT_RUN | NOT_RUN |
| POST | /api/v1/admin/site/faq | ADMIN, SUPERADMIN | NOT_RUN | NOT_RUN | NOT_RUN |
| PATCH | /api/v1/admin/site/faq/{id} | ADMIN, SUPERADMIN | NOT_RUN | NOT_RUN | NOT_RUN |
| DELETE | /api/v1/admin/site/faq/{id} | ADMIN, SUPERADMIN | NOT_RUN | NOT_RUN | NOT_RUN |
| POST | /api/v1/admin/site/pricing | ADMIN, SUPERADMIN | NOT_RUN | NOT_RUN | NOT_RUN |
| PATCH | /api/v1/admin/site/pricing/{id} | ADMIN, SUPERADMIN | NOT_RUN | NOT_RUN | NOT_RUN |
| DELETE | /api/v1/admin/site/pricing/{id} | ADMIN, SUPERADMIN | NOT_RUN | NOT_RUN | NOT_RUN |
| PATCH | /api/v1/admin/site/stats | ADMIN, SUPERADMIN | NOT_RUN | NOT_RUN | NOT_RUN |
| GET | /api/v1/admin/media | ADMIN, SUPERADMIN | NOT_RUN | NOT_RUN | NOT_RUN |
| PATCH | /api/v1/admin/media/{id} | ADMIN, SUPERADMIN | NOT_RUN | NOT_RUN | NOT_RUN |
| POST | /api/v1/compliance/consent | Public / provider signature | NOT_RUN | NOT_RUN | NOT_RUN |
| POST | /api/v1/compliance/terms | Authenticated | NOT_RUN | NOT_RUN | NOT_RUN |
| GET | /api/v1/compliance/export | Authenticated | NOT_RUN | NOT_RUN | NOT_RUN |
| DELETE | /api/v1/compliance/account | Authenticated | NOT_RUN | NOT_RUN | NOT_RUN |
| POST | /api/v1/payments/webhooks/stripe | Public / provider signature | NOT_RUN | NOT_RUN | NOT_RUN |
| POST | /api/v1/payments/webhooks/razorpay | Public / provider signature | NOT_RUN | NOT_RUN | NOT_RUN |
