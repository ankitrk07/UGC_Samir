# Frontend integration

Current development workflow: npm run dev:all starts the existing API/worker/frontend only after authenticated native/managed service checks and API readiness. npm run dev remains frontend-only. No container runtime is required; refer to WINDOWS-STARTUP.md. API_URL remains workspace-specific: backend origin versus frontend versioned /api/v1 base.

## Environment and requests

The root frontend was moved to `frontend/`; run Next commands in that workspace. Set:

```dotenv
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
API_URL=http://localhost:4000/api/v1
```

`API_URL` is an optional private server-side override for an internal API hostname. Both API values include `/api/v1`. In production use HTTPS URLs. `NEXT_PUBLIC_MEDIA_HOST` allows the replacement showcase CDN hostname in Next/Image; rebuild after changing it.

Browser components call `frontend/src/lib/api.ts` with paths such as `/campaigns`. The helper calls the same-origin Next route `frontend/src/app/api/backend/[...path]/route.ts`. The bridge forwards only allowed paths, validates mutation origin, passes the access cookie as an Authorization bearer token, unwraps the API envelope, streams report downloads, and puts tokens in httpOnly cookies. Access tokens expire after 15 minutes and refresh tokens after 7 days. Cookies are Secure in production and SameSite=Lax; no browser localStorage token is used. Refresh rotation is coordinated with one in-flight request and browser Web Locks where supported.

The backend returns `{success,data,error,meta}`. Components receive `data` through the bridge. Direct API integrations must handle that envelope themselves. Auth failures are explicit; the live dashboard no longer replaces failed requests with mock data.

Backend `CORS_ORIGINS` is a comma-separated exact origin whitelist, for example `https://trendhive.example,http://localhost:3000` in development. Production accepts explicit HTTPS origins. Configure `SITE_URL` to the frontend origin and `API_URL` to the public API origin WITHOUT `/api/v1`. Do not confuse these backend origin values with the frontend base URLs.

Direct cookie clients must request `GET /api/v1/auth/csrf`, preserve the CSRF cookie, and send the returned token in `X-CSRF-Token` on writes. The Next bridge validates same-origin writes and authenticates its upstream connection using a bearer token. Postman can use bearer authentication; do not expose refresh tokens to client JavaScript.

## Files connected to the API

| File under frontend/src | Live integration |
| --- | --- |
| lib/api.ts | Same-origin request helper and refresh/retry |
| lib/backend-policy.ts; app/api/backend/[...path]/route.ts | Bridge allowlist, input checks, cookies and streaming |
| components/forms.tsx | Auth, onboarding drafts/final, contact, creator lead, newsletter, real booking slots |
| components/dashboard.tsx | Campaigns, creators, dashboard analytics, notifications, export, logout |
| components/analytics-preview.tsx | Views/engagement/ROI and date controls |
| components/public-data.tsx | Public pricing, FAQ, testimonials, showcase, stats context |
| components/pricing.tsx; components/brand-page.tsx; components/shell.tsx | API-backed public content |
| components/live-stat.tsx; components/hero.tsx | Public counters |
| app/auth/google/start/route.ts; app/auth/google/callback/route.ts | Browser-bound OAuth handshake and secure cookie exchange |
| app/complete-account/page.tsx | Explicit terms acceptance for new Google accounts |
| components/token-action.tsx; app/verify-email; app/newsletter | Email verification, opt-in and unsubscribe |
| app/booking/manage/page.tsx | Token-authenticated reschedule/cancel |
| app/sitemap.ts | Public sitemap data |
| lib/generated/api.d.ts | Generated API types used by data DTOs |
| config/assets.ts; lib/data.ts | Seed source and explicit demo fixtures |

`/dashboard-demo` intentionally remains illustrative. Existing public copy/assets may render while public data loads; dashboard metrics and slot availability never silently become mock responses. Showcase overrides use the original asset IDs so an admin can replace a photo/video without changing components.

Brand multi-step onboarding saves drafts on Next and submits the validated final profile. Campaign response fields are `name`, `category`, title-cased `status`, `creators`, `views`, `budget`. Campaign DTO money uses major units; payouts, wallet, payment and revenue ingestion use integer minor units and explicit currency. Chart `views` are in thousands, while `totalViews` is an integer count. ROI is attributed revenue divided by spend; zero spend returns zero.

## Google and new product surfaces

Register `BACKEND_API_ORIGIN/api/v1/auth/google/callback` in the Google web client. The backend handles state/PKCE, validates verified identity, and returns a short-lived one-time exchange code to the Next callback. Browser binding is checked before session cookies are installed. Existing password accounts are not silently linked by matching email.

The original frontend does not contain full creator workflow, team, chat, payment checkout or admin screens. Their API endpoints are available for future screens, with bearer/cookie ownership checks. Adding such screens requires expanding the bridge allowlist with explicit validation; the bridge deliberately is not an unrestricted API proxy. For real-time chat, connect Socket.IO to the API using a short-lived access token or a securely proxied cookie connection; do not weaken httpOnly cookies to expose refresh tokens. See the socket event contract in backend/src/modules/chat/socket.ts.

## Contract updates

Run `npm run contracts:generate` after route/schema changes; review the OpenAPI, Postman, route inventory and frontend types in the same change. The generator evaluates route declarations and real Zod schemas without starting Redis or a database. Custom Zod refinements remain authoritative at runtime. Some secondary response schemas are generic; inspect their service implementation before building new screens. The original component contracts are recorded in API-CONTRACT.md.
