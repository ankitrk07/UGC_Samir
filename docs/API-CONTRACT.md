## Disabled SMTP behavior (2026-11-24)

Response envelopes and paths remain unchanged. With blank SMTP, signup returns authenticated=false and a message explaining verification is pending until delivery is configured. Password reset/email resend return a generic delivery-disabled message, without account lookup. Account verification is not bypassed. After SMTP is enabled, request fresh verification/reset links; old queued links can expire.

# TRENDHIVE frontend alignment — Step 0

Current startup (2026-11-23): use check:services and dev:all after configuring native/managed PostgreSQL and Redis. Root dev remains frontend-only for compatibility. Combined startup waits for API readiness and validates the frontend /api/v1 target against the backend port. No REST DTO or UI design changed. No Docker command or mock success response is used to hide an unavailable backend.

Scanned the original root `src/` before backend implementation; it now lives in `frontend/src/`. All API paths below are relative to `/api/v1`. The browser uses `/api/backend/` through the Next.js bridge. Backend responses are `{success,data,error,meta}`; the bridge unwraps `data` so existing component contracts remain unchanged. Money in campaign DTOs is major units; accounting records use integer minor units.

| Frontend file / section | Endpoint | Method | Request | Component response (data) | Auth |
|---|---|---|---|---|---|
| components/forms.tsx AuthForm signup | auth/signup | POST | name (2–100), email, password (8–128, uppercase, digit), termsAccepted:true, optional plan:self-service, billing:monthly/annual, role:BRAND/CREATOR | authenticated:false,message (verify email before login) | guest |
| forms.tsx login | auth/login | POST | email,password (nonempty) | authenticated:true,user:{id,name,email,role},expiresIn; cookies handled by bridge | guest |
| forms.tsx forgot | auth/forgot-password | POST | email | message (non-enumerating) | guest |
| reset-password.tsx | auth/reset-password | POST | token,password (same signup policy); confirm checked locally | message | guest |
| dashboard.tsx session | auth/me | GET | — | user:{id,name,email,role} | session |
| dashboard.tsx logout | auth/logout | POST | {} | message | session |
| forms.tsx Newsletter | newsletter | POST | email | message | guest |
| forms.tsx BookingForm availability | bookings/slots | GET | query date:YYYY-MM-DD,timezone:IANA | slots:string[] (HH:mm) | guest |
| forms.tsx BookingForm submit | bookings | POST | name(2+),email,brand(2+),date (future weekday),time,timezone,notes(max1000) | id,status,startsAt,timezone | guest |
| forms.tsx CreatorForm | creators/apply | POST | name(2+),email,country(2+),instagram,tiktok (empty or optional @ + 2–50 letters/digits/._),niche; at least one handle | message | guest |
| forms.tsx ContactForm | contact | POST | name(2+),email,message(10–2000) | message | guest |
| forms.tsx OnboardingForm final | brand/onboarding | POST | brand(2+),website:URL,goal:Awareness/Product launch/Creator content/Sales,budget:Under $1,000/$1,000–$5,000/$5,000–$15,000/$15,000+,countries:[string] min1,platforms:[string] min1 | BrandProfile | BRAND |
| forms.tsx OnboardingForm Next / Back | brand/onboarding | PATCH | partial onboarding draft | BrandProfile | BRAND |
| dashboard.tsx campaigns | campaigns | GET | optional q,status,country,platform,niche,minBudget,maxBudget,sort,limit,offset,cursor | [{id,name,category,status:Live/Review/Completed/Draft,creators:number,views:number,budget:number}] | session (brand scoped) |
| dashboard.tsx CampaignForm | campaigns | POST | name(trim3–80),category(1–60),budget(number1–1000000),brief(trim20–3000) | campaign DTO above | BRAND |
| dashboard.tsx creator directory | creators | GET | optional q,country,niche,limit,offset | [{id,handle,niche,country,followers:number,engagement:number}] | session |
| dashboard.tsx analytics / Overview | analytics | GET | optional days:7/30,from,to,campaignId | {totalViews,engagement,activeCreators,earnedValue,series:[{day:string,views:number in K,engagement:number,roi:number}]} | session, scoped |
| analytics-preview.tsx Views / Engagement / ROI | analytics | GET | days / date range | above series, locally selects metric and last7/30 | session |
| dashboard.tsx export | analytics/export | GET | format:csv/pdf,days,campaignId | attachment | session |
| dashboard.tsx notification modal | notifications | GET | limit,offset | notification array | session |
| pricing.tsx monthly/annual + signup CTA | pricing | GET | — | [{plan,name,monthly,annual,currency,features}] | guest |
| pricing.tsx FAQ accordion | faq | GET | — | [{id,question,answer,order}] | guest |
| brand-page.tsx testimonial carousel | testimonials | GET | — | [{id,type,quote,tag,initials,color,metric,label,order}] | guest |
| shell.tsx + public counters | stats | GET | — | {creators,views,posts,countries} | guest |
| config/assets.ts video/photo/logo wall | media/showcase | GET | optional section | Asset[]: id,section,url,finalPath,size,type,alt (same asset keys) | guest |
| app/sitemap.ts | sitemap | GET | — | {paths,campaigns} | guest |
| creator-country / onboarding market selectors | countries | GET | — | string[] | guest |
| cookie consent (new API; no current widget) | compliance/consent | POST | anonymousId,necessary:true,analytics,marketing,version | consent | guest |

## Exhaustive interaction inventory

Forms: Newsletter, AuthForm (login/signup/forgot modes), BookingForm, CreatorForm, ContactForm, OnboardingForm, CampaignForm, ResetPassword. Zod schemas: emailSchema, loginSchema, signupSchema, bookingSchema, contactSchema, onboardingSchema, creatorSchema in lib/schemas.ts; campaignSchema in dashboard.tsx; password/confirm schema in reset-password.tsx; proxy signup/reset/campaign refinements in app/api/backend/[...path]/route.ts. No Axios. All browser requests use lib/api.ts; the Next bridge makes upstream fetches.

Buttons with server intent: submit buttons above, availability retry, dashboard reconnect, logout, create campaign, notification menu, report export. Previously local actions: campaign/creator search and filters, campaign and creator detail modals, notification modal populated from campaigns, metric tabs/time range, onboarding next/back and country/platform chips, pricing monthly/annual, FAQ toggles, testimonial prev/next/play/pause/swipe, brand story steps, video play/pause, navigation/menu, theme, password visibility, toast dismissal, modal close, error retry. Presentation controls remain local; APIs exist for persistent/domain data.

Zustand: only store/ui.ts (menuOpen, toasts, annual). No persisted auth or domain store. Theme localStorage key is presentation only.

Mock/fallback inventory: lib/data.ts mockCampaigns/mockCreators/mockAnalytics/campaignData; dashboard demo session creates DEMO-* local campaigns and uses all mocks; live dashboard previously substituted mock arrays when any request failed; analytics-preview uses campaignData when demo; BookingForm previously substituted 10:00/11:30/14:00/15:30 on failure; pricing/FAQ/testimonials/stats and assets are hardcoded public presentation data. Explicit /dashboard-demo remains illustrative. Live failures must not appear as real performance or real slot availability.

## Additional requested backend surface

See generated `backend/openapi.json` and `/docs` for the implemented route registry, input schemas, and role requirements. The requested team invitations, campaign workflow, social linking, portfolio, wallet/payout, subscription/payment, chat, notifications, admin and compliance APIs extend beyond the current frontend. Their availability is recorded in `docs/COVERAGE.md`; endpoint existence is not a claim that a third-party integration has passed live acceptance testing.

The current integrated source locations are enumerated in FRONTEND-INVENTORY.md. See STRUCTURE.md for the folder layout and PHASES.md for verification status.

## Startup and proxy constraints (2026-11-13)

Root npm run dev launches Next.js only. Start the API separately with npm run dev:api and the worker with npm run worker -w backend. The private frontend API_URL (or public fallback NEXT_PUBLIC_API_URL) must be an HTTP(S) base ending in /api/v1. Backend API_URL is a bare origin. setup:local creates missing files without overwriting configured files.

The bridge reports 503 for a missing/malformed base or unreachable API; it never returns fake successful data. Request bodies are limited while streaming to 32,000 UTF-8 bytes, must use application/json, and retain same-origin mutation checks. The response envelope and original UI DTOs remain unchanged. HTTP pagination query schemas reject unknown fields; pagination helpers preserve each endpoint's declared filters.

Live affected APIs were probed again: direct port 4000 refused connections and the proxy returned genuine unreachable-service 503 responses. No endpoint is marked live-tested based on OpenAPI, Postman, source inspection or a contract test. See API-OPERATION-VERIFICATION.md.

Unavailable API-driven live counters display a dash instead of the original fixture total; styling/layout is preserved. Original test expectations were adjusted to test unavailable-state honesty rather than requiring a hardcoded 250K count. Desktop/mobile browser checks pass. This is not a successful real stats API result.

2026-11-15 payment follow-up: subscription/refund webhook changes now reconcile current provider state with bounded provider reads and transactional retries. Sandbox/provider/database acceptance remains pending. Renewal preserves old billing identities; uncorrelated external refunds require audited finance reconciliation. See PAYMENT-RECONCILIATION.md. Automated payout settlement is unchanged and remains manual/unverified.
