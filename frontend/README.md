# TRENDHIVE

A complete Next.js 14 App Router frontend for an organic creator-network marketing platform. By onetrendsetter.

## Run locally

Use Node.js 22.18+ (Node 22 LTS recommended). From this directory:

    npm install
    cp .env.example .env.local
    npm run dev

On Windows PowerShell, use npm.cmd if PowerShell blocks npm.ps1:

    npm.cmd install
    Copy-Item .env.example .env.local
    npm.cmd run dev

Open http://localhost:3000/for-brands. The root URL serves the same brand experience. Start with /dashboard-demo to explore the product without a backend or account.

The predev and prebuild scripts download Clash Display, Satoshi and JetBrains Mono once. They are then served locally through next/font/local. Internet access is required for the first dependency installation and font setup. If Fontshare is unavailable, place the three licensed WOFF2 files named in src/app/fonts/README.md in that directory. The script skips existing files.

For a production build:

    npm run build
    npm start

Set NEXT_PUBLIC_SITE_URL to the production origin before building so canonical URLs, social metadata, robots.txt and the sitemap point to the right domain. This source project has not been published.

## Verification status in this workspace

- PASS: full TypeScript checking.
- PASS: all 24 browser tests on desktop and mobile, covering existing flows and the new theme controls.
- PASS: six API-policy tests and the 18-entry asset integrity check.
- PASS: 28 light-mode route/viewport checks (14 routes at 1440px and 360px), with no JavaScript/hydration errors, unintended page overflow or dark UI surfaces. Supplemental computed-color checks found no low-contrast text in the inspected DOM; this is not a complete accessibility certification.
- PASS: normal-motion smoke check confirms both ScrollTrigger pins remain active after theme switches, with no JavaScript errors.
- PASS: original global CSS is unchanged; representative dark palette, borders, typography and surface styles match the pre-change baseline.
- PARTIAL: the production build compiles and completes type validation, but fails prerendering the existing /icon and /opengraph-image metadata routes. The current Windows/Node 26 environment raises Invalid URL inside Next.js bundled @vercel/og font-path handling. Those image generators and the Next.js version were left unchanged.
- Screenshots of both themes on desktop/mobile are linked in THEME-COMPARISON.md. Some external dummy media requests are blocked by the sandbox network.

Run the checks locally:

    npm run typecheck
    npm test
    npm run assets:check
    npx playwright install chromium
    npm run test:ui

The browser suite accepts optional PLAYWRIGHT_BASE_URL and PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH environment variables for an existing local server or installed Chromium-based browser. Without those variables it uses the standard Playwright Chromium installation and localhost:3000.

## What is built

Phase 1: project configuration, design tokens, centralized media catalog, reusable magnetic and split-text hooks, fonts, layout, floating navigation, toast system and mobile menu.

Phase 2: all fourteen brand-page sections, lazy R3F shader hive, preloader, creator-card orbit, logo marquee, GSAP-pinned three-part story, desktop horizontal value cards, draggable looping video gallery, comparison, swipeable example stories, interactive Recharts preview, pricing, world map, particle CTA and footer.

Phase 3: creator landing page and application, standalone pricing and FAQ, booking with day/time selection, signup/login/forgot/reset-password, brand onboarding, contact, newsletter, demo and live dashboard, API bridge, metadata/OG image/favicon/sitemap/robots, responsive styles, accessible modal focus handling, tests and asset documentation.

All source implementation phases are present. See the current verification results above, including the separate metadata-image build blocker.

## Routes

| Route | Purpose |
| --- | --- |
| / and /for-brands | Full brand landing experience |
| /for-creators | Creator story, workflow and application |
| /pricing | Monthly/annual pricing and FAQ |
| /book-call | Booking request with availability lookup |
| /login | Validated cookie-based login |
| /signup | Seven-day trial signup; preserves selected billing period |
| /forgot-password | Email reset request |
| /reset-password?token=… | New password form |
| /onboarding | Authenticated three-step brand setup |
| /contact | Contact form |
| /dashboard-demo | Fully interactive illustrative workspace |
| /dashboard | Session-protected API-backed workspace |
| /legal/privacy and /legal/terms | Explicitly labeled draft operator notices |
| /opengraph-image and /icon | Generated social image and favicon |
| /sitemap.xml and /robots.txt | Search metadata |

## Folder structure

    trendhive/
      public/assets/
        images/                 Final creator photos and posters go here
        videos/                 Final MP4 clips go here
        logos/                  Eight neutral SVG wordmarks, included
      scripts/
        prepare-fonts.mjs       One-time publisher font downloads
        check-assets.mjs        Asset integrity and centralization check
        generate-asset-checklist.mjs
      src/
        app/
          api/backend/[...path]/route.ts
          fonts/
          for-brands/   for-creators/   pricing/   book-call/
          login/   signup/   forgot-password/   reset-password/
          onboarding/   contact/   dashboard/   dashboard-demo/
          legal/[document]/
          layout.tsx   page.tsx   globals.css
          opengraph-image.tsx   icon.tsx   sitemap.ts   robots.ts
          error.tsx   not-found.tsx   loading.tsx
        components/
          hero.tsx              Editorial headline and media orbit
          hive-scene.tsx        Lazy-loaded shader hexagon cluster
          brand-page.tsx        Full marketing page and story sections
          video-card.tsx        Visibility-aware poster/video previews
          analytics-preview.tsx Recharts metrics, tabs and range selector
          pricing.tsx           Tilt/glare cards, billing toggle and FAQ
          dashboard.tsx         Product workspace and campaign flows
          forms.tsx             RHF/Zod forms and multi-step onboarding
          auth-page.tsx         Shared auth composition
          reset-password.tsx    Reset-link completion
          shell.tsx             Lenis/GSAP, navigation, cursor and footer
          modal.tsx             Accessible focus-trapped dialogs
          ui.tsx                Buttons, labels, toasts, hive mark
        config/assets.ts        The only photo/video/logo catalog
        hooks/                  useMagnetic, useSplitText
        lib/
          api.ts                Browser client for same-origin bridge
          schemas.ts            Shared validation schemas
          backend-policy.mjs    Testable REST/auth boundary rules
          data.ts               Clearly illustrative fallback data
        store/ui.ts             Zustand navigation, pricing and toasts
      tests/
        backend-policy.test.mjs
        browser/flows.spec.ts
      .env.example
      next.config.mjs   tailwind.config.ts   postcss.config.mjs
      tsconfig.json   playwright.config.ts   package.json
      ASSET-CHECKLIST.md
      README.md

## REST integration

Set NEXT_PUBLIC_API_URL to the backend base URL, for example https://api.your-domain.example/v1. Do not include a trailing endpoint. This setting contains no secret. The browser calls /api/backend/* on the Next.js origin; the server forwards only allowlisted routes.

The integration is implemented against the contract below because no backend schema or credentials were supplied. If your backend uses different paths or response envelopes, adapt the single route handler and the dashboard client contract.

### Authentication

POST /auth/signup:

    { "name": "Jordan", "email": "jordan@example.com",
      "password": "Password123", "termsAccepted": true,
      "plan": "self-service", "billing": "monthly" }

POST /auth/login:

    { "email": "jordan@example.com", "password": "Password123" }

Successful login response, and optionally signup response:

    { "accessToken": "JWT", "expiresIn": 86400,
      "user": { "id": "brand-1", "name": "Jordan", "email": "jordan@example.com" } }

The bridge also accepts token instead of accessToken. It consumes the JWT on the server and returns only a sanitized user/message/authenticated response to the browser. It sets trendhive_session with httpOnly, SameSite=Lax, Path=/ and Secure in production. Cookie duration defaults to one day and is capped at seven days. Do not return tokens nested inside a different response envelope without adapting the handler.

Signup without a token is treated as pending email verification. The frontend shows a verification message instead of pretending the user is logged in. Login without a token is rejected as an invalid authentication response.

GET /auth/me returns:

    { "user": { "id": "brand-1", "name": "Jordan", "email": "jordan@example.com" } }

POST /auth/forgot-password accepts an email. Configure the backend email link to /reset-password?token=YOUR_TOKEN on the frontend origin. POST /auth/reset-password accepts token and password. POST /auth/logout revokes the backend session when reachable and always clears the local cookie.

Authenticated requests include Authorization: Bearer JWT from the server bridge. No JWT is placed in browser localStorage or sessionStorage. Session presence protects server pages; the backend remains responsible for verifying JWTs and authorizing private data. A 401 clears the session and returns the dashboard visitor to login.

The bridge rejects cross-origin writes, unknown endpoints and unsupported methods. Backend origin/scheme must be preserved by the deployment proxy. GET requests and private responses use no-store caching. Errors use a JSON object containing message.

### Forms

| Endpoint | Method | JSON body / response |
| --- | --- | --- |
| /newsletter | POST | email; return a successful 2xx JSON response |
| /contact | POST | name, email, message |
| /creators/apply | POST | name, email, country, niche, instagram, tiktok; at least one handle |
| /brand/onboarding | POST, authenticated | brand, website, goal, budget, countries[], platforms[] |
| /bookings/slots?date=YYYY-MM-DD&timezone=Asia%2FCalcutta | GET | Return { "slots": ["10:00", "11:30", "14:00"] } in the requested timezone |
| /bookings | POST | name, email, brand, date, time, timezone, notes |
| /campaigns | POST, authenticated | name, category, budget (number, USD), brief; return the new Campaign object |

Booking availability is requested per selected day and browser timezone. Weekends and past dates fail validation. If availability is offline, the UI clearly labels suggested request times; submitting still calls the backend and will not show success unless that service accepts the request. The backend must validate final availability. A booking success means the request was accepted, with confirmation sent by the backend.

Contact, newsletter, auth and creator applications do not fake successful submissions when the API is unavailable. Every form has validation and pending/error/success feedback.

### Dashboard data

GET /campaigns returns an array:

    [
      { "id": "TH-001", "name": "The everyday edit", "category": "Lifestyle",
        "status": "Live", "creators": 84, "views": 1240000, "budget": 2400 }
    ]

Use the status values Live, Review or Completed.

GET /creators returns an array:

    [
      { "id": "C-01", "handle": "@creator", "niche": "Lifestyle",
        "country": "United Kingdom", "followers": 42000, "engagement": 6.8 }
    ]

GET /analytics returns:

    { "totalViews": 4830000, "engagement": 8.4, "activeCreators": 280,
      "earnedValue": 34800,
      "series": [
        { "day": "01", "views": 18, "engagement": 4.2, "roi": 1.2 },
        { "day": "05", "views": 31, "engagement": 4.9, "roi": 1.8 }
      ] }

Series views are in thousands; ROI is a multiple; engagement is a percentage. The chart shows the latest available series value for ROI. Return one daily point per day in ascending order. The 7-day view uses the most recent seven daily points and recomputes the view total for that range.

The dashboard loads campaigns, creators, analytics and the current user together. An unavailable or malformed data response switches the whole data view to a consistent, explicitly marked illustrative dataset. A 401 instead redirects to login. Reconnect retries the live requests. Demo campaign creation is local to the current mounted demo session, with no external writes. Actual campaign creation always calls the real endpoint, including during an API outage, and reports failures honestly.

Search, campaign-status filters, creator-niche filters, view switches, campaign/creator detail dialogs, notifications, chart tabs/range and CSV export all work in demo mode. CSV reports identify demo data in their filename. No payment processor is implemented; pricing choices are passed through signup for backend handling.

## Media and content

See ASSET-CHECKLIST.md for the complete table of final paths, types, sections, recommended formats and current sources. Generate it again after catalog edits with:

    node scripts/generate-asset-checklist.mjs

All photos are temporary Picsum images. Videos use the requested public sample MP4 hosts and always have poster images. No YouTube embeds or WebGL video textures are used.

Every media consumer reads src/config/assets.ts. To replace a photo or video, drop the final file into public/assets and set that entry’s url to its finalPath. The procedural hive mark, grain, flags, map and particle field are code-native visuals.

Displayed creator handles, customer-type stories, growth percentages, earnings estimates, launch pricing and dashboard metrics are illustrative, with labels in the interface. The 250K creators / 300M views / 60+ country claims were supplied in the brief. Replace demonstration stories and confirm commercial claims before production use. Social links currently lead to generic Instagram/LinkedIn homepages because brand profile URLs were not supplied. Legal notices are clearly labeled drafts awaiting operator details.

## Motion, accessibility and performance decisions

- Lenis runs from GSAP’s ticker and notifies ScrollTrigger. Tickers, listeners, observers and contexts are cleaned up.
- The shader hive loads after the opening reveal, on desktop only, and unmounts outside the hero viewport. Pixel ratio is capped at 1.5. Unsupported WebGL gets a static fallback.
- Recharts loads near the dashboard preview rather than on the first hero render.
- Video source assignment waits until a card is near the viewport and previewed. Playback is muted, inline and looping, pauses on exit, and has a click/tap alternative.
- Desktop story/value pins become direct controls and native horizontal touch scrolling on smaller screens. Carousel controls have keyboard navigation.
- Reduced motion disables smooth scrolling, pinning, autoplay previews, particles, counters and rotations; Framer UI transitions inherit the user preference.
- Buttons and inputs have visible focus styles. Forms include labels, inline errors and status notifications. Menus and dialogs handle Escape, focus trapping and focus restoration.
- Images use next/image with responsive sizes. SEO includes per-route metadata, canonical pages, generated OG art/favicon, sitemap and robots exclusions.
- No analytics tracker, billing system, actual email delivery or real campaign fulfillment is included; those belong to the configured backend.

Technical references used during implementation:
[Next font documentation](https://nextjs.org/docs/app/api-reference/components/font),
[React Three Fiber installation and React version compatibility](https://github.com/pmndrs/react-three-fiber/blob/master/docs/getting-started/installation.mdx),
[Lenis official GSAP integration](https://github.com/darkroomengineering/lenis).

## Light and dark appearance

Dark is the default even when the operating system prefers light. A Sun/Moon control in the main navbar, mobile fullscreen menu and dashboard header switches appearance. The localStorage key is trendhive-theme; only the values dark and light are accepted. Clearing it restores dark. The inline head initializer applies a saved choice before paint, while ThemeProvider keeps React state, browser color-scheme, theme-color metadata and cross-tab storage events synchronized. If storage is unavailable, switching still works for the current page.

Appearance tokens and light section adaptations are centralized in src/app/themes.css. The original globals.css and brand pigments remain unchanged. Charts, chart tooltips, map markers and canvas particles use shared theme variables. Light mode uses warm paper, white cards, subtle tinted surfaces and readable olive/berry/violet text accents. Media overlays keep their intended contrast. Theme changes update colors without remounting scenes, resetting forms or rebuilding GSAP timelines.

Testing also corrected two reduced-motion hydration differences in the shared fade and testimonial drag setup, and contained decorative/accessibility overflow without altering section dimensions or scrolling behavior. No backend logic or API routes were changed.

See THEME-COMPARISON.md for the screenshot table. The full per-route coverage report is artifacts/theme/coverage-report.json. To regenerate those screenshots against a running local server, run node scripts/verify-theme-coverage.mjs with the optional Playwright environment variables described above.
