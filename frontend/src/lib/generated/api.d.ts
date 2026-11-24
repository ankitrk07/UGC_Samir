// Generated from backend/openapi.json by scripts/export-contracts.cjs. Do not edit.
export interface components { schemas: {
"Campaign": { "id": string; "name": string; "category": string; "status": "Live" | "Review" | "Completed" | "Draft" | "Cancelled"; "creators": number; "views": number; "budget": number; "brief"?: string; "currency"?: string; "platforms"?: Array<string>; "countries"?: Array<string>; };
"Creator": { "id": string; "handle": string; "niche": string; "country": string; "followers": number; "engagement": number; };
"Analytics": { "totalViews": number; "engagement": number; "activeCreators": number; "earnedValue": number; "reach"?: number; "roi"?: number; "cpv"?: number; "series": Array<{ "day": string; "date"?: string; "views": number; "engagement": number; "roi": number; }>; };
"Error": { "code": string; "message": string; };
}; }
export interface paths {
"/api/v1/auth/csrf": {
get: { response: { "success": boolean; "data": unknown; "error": components["schemas"]["Error"]; "meta": {  } | null; }; };
};
"/api/v1/auth/google/exchange": {
post: { requestBody: { "code": string; }; response: { "success": boolean; "data": unknown; "error": components["schemas"]["Error"]; "meta": {  } | null; }; };
};
"/api/v1/auth/signup": {
post: { requestBody: { "name": string; "email": string; "password": string; "termsAccepted": true; "role"?: "BRAND" | "CREATOR"; "plan"?: "self-service"; "billing"?: "monthly" | "annual"; }; response: { "success": boolean; "data": unknown; "error": components["schemas"]["Error"]; "meta": {  } | null; }; };
};
"/api/v1/auth/login": {
post: { requestBody: { "email": string; "password": string; }; response: { "success": boolean; "data": unknown; "error": components["schemas"]["Error"]; "meta": {  } | null; }; };
};
"/api/v1/auth/me": {
get: { response: { "success": boolean; "data": unknown; "error": components["schemas"]["Error"]; "meta": {  } | null; }; };
};
"/api/v1/auth/refresh": {
post: { requestBody: { "refreshToken"?: string; }; response: { "success": boolean; "data": unknown; "error": components["schemas"]["Error"]; "meta": {  } | null; }; };
};
"/api/v1/auth/logout": {
post: { requestBody: {  }; response: { "success": boolean; "data": unknown; "error": components["schemas"]["Error"]; "meta": {  } | null; }; };
};
"/api/v1/auth/logout-all": {
post: { requestBody: {  }; response: { "success": boolean; "data": unknown; "error": components["schemas"]["Error"]; "meta": {  } | null; }; };
};
"/api/v1/auth/forgot-password": {
post: { requestBody: { "email": string; }; response: { "success": boolean; "data": unknown; "error": components["schemas"]["Error"]; "meta": {  } | null; }; };
};
"/api/v1/auth/resend-verification": {
post: { requestBody: { "email": string; }; response: { "success": boolean; "data": unknown; "error": components["schemas"]["Error"]; "meta": {  } | null; }; };
};
"/api/v1/auth/reset-password": {
post: { requestBody: { "token": string; "password": string; }; response: { "success": boolean; "data": unknown; "error": components["schemas"]["Error"]; "meta": {  } | null; }; };
};
"/api/v1/auth/verify-email": {
post: { requestBody: { "token": string; }; response: { "success": boolean; "data": unknown; "error": components["schemas"]["Error"]; "meta": {  } | null; }; };
};
"/api/v1/auth/change-password": {
post: { requestBody: { "currentPassword": string; "password": string; }; response: { "success": boolean; "data": unknown; "error": components["schemas"]["Error"]; "meta": {  } | null; }; };
};
"/api/v1/auth/google": {
get: { response: { "success": boolean; "data": unknown; "error": components["schemas"]["Error"]; "meta": {  } | null; }; };
};
"/api/v1/auth/google/callback": {
get: { response: { "success": boolean; "data": unknown; "error": components["schemas"]["Error"]; "meta": {  } | null; }; };
};
"/api/v1/brand/billing": {
patch: { requestBody: { "billingName": string; "billingAddress": string; "gstin"?: string; }; response: { "success": boolean; "data": unknown; "error": components["schemas"]["Error"]; "meta": {  } | null; }; };
};
"/api/v1/brand/profile": {
patch: { requestBody: { "brand"?: string; "website"?: string; "goal"?: "Awareness" | "Product launch" | "Creator content" | "Sales"; "budget"?: "Under $1,000" | "$1,000–$5,000" | "$5,000–$15,000" | "$15,000+"; "countries"?: Array<string>; "platforms"?: Array<"Instagram" | "TikTok" | "YouTube">; }; response: { "success": boolean; "data": unknown; "error": components["schemas"]["Error"]; "meta": {  } | null; }; };
get: { response: { "success": boolean; "data": unknown; "error": components["schemas"]["Error"]; "meta": {  } | null; }; };
delete: { response: { "success": boolean; "data": unknown; "error": components["schemas"]["Error"]; "meta": {  } | null; }; };
};
"/api/v1/creators/{id}/profile": {
get: { response: { "success": boolean; "data": unknown; "error": components["schemas"]["Error"]; "meta": {  } | null; }; };
};
"/api/v1/brand/onboarding": {
post: { requestBody: { "brand": string; "website": string; "goal": "Awareness" | "Product launch" | "Creator content" | "Sales"; "budget": "Under $1,000" | "$1,000–$5,000" | "$5,000–$15,000" | "$15,000+"; "countries": Array<string>; "platforms": Array<"Instagram" | "TikTok" | "YouTube">; }; response: { "success": boolean; "data": unknown; "error": components["schemas"]["Error"]; "meta": {  } | null; }; };
patch: { requestBody: { "brand"?: string; "website"?: string; "goal"?: "Awareness" | "Product launch" | "Creator content" | "Sales"; "budget"?: "Under $1,000" | "$1,000–$5,000" | "$5,000–$15,000" | "$15,000+"; "countries"?: Array<string>; "platforms"?: Array<"Instagram" | "TikTok" | "YouTube">; }; response: { "success": boolean; "data": unknown; "error": components["schemas"]["Error"]; "meta": {  } | null; }; };
};
"/api/v1/brand/team": {
get: { response: { "success": boolean; "data": unknown; "error": components["schemas"]["Error"]; "meta": {  } | null; }; };
};
"/api/v1/brand/team/invites": {
post: { requestBody: { "email": string; "permission"?: "VIEWER" | "EDITOR"; }; response: { "success": boolean; "data": unknown; "error": components["schemas"]["Error"]; "meta": {  } | null; }; };
};
"/api/v1/brand/team/accept": {
post: { requestBody: { "token": string; }; response: { "success": boolean; "data": unknown; "error": components["schemas"]["Error"]; "meta": {  } | null; }; };
};
"/api/v1/brand/team/{id}": {
delete: { response: { "success": boolean; "data": unknown; "error": components["schemas"]["Error"]; "meta": {  } | null; }; };
};
"/api/v1/campaigns": {
get: { response: { "success": boolean; "data": Array<components["schemas"]["Campaign"]>; "error": components["schemas"]["Error"]; "meta": {  } | null; }; };
post: { requestBody: { "name": string; "category": string; "budget": number; "brief": string; "goal"?: string; "currency"?: "USD" | "INR" | "EUR" | "GBP"; "countries"?: Array<string>; "platforms"?: Array<"Instagram" | "TikTok" | "YouTube">; "startDate"?: string; "endDate"?: string; }; response: { "success": boolean; "data": components["schemas"]["Campaign"]; "error": components["schemas"]["Error"]; "meta": {  } | null; }; };
};
"/api/v1/campaigns/marketplace": {
get: { response: { "success": boolean; "data": unknown; "error": components["schemas"]["Error"]; "meta": {  } | null; }; };
};
"/api/v1/brand/jobs": {
post: { requestBody: { "name": string; "category": string; "budget": number; "brief": string; "goal"?: string; "currency"?: "USD" | "INR" | "EUR" | "GBP"; "countries"?: Array<string>; "platforms"?: Array<"Instagram" | "TikTok" | "YouTube">; "startDate"?: string; "endDate"?: string; }; response: { "success": boolean; "data": unknown; "error": components["schemas"]["Error"]; "meta": {  } | null; }; };
};
"/api/v1/campaigns/{id}": {
get: { response: { "success": boolean; "data": unknown; "error": components["schemas"]["Error"]; "meta": {  } | null; }; };
patch: { requestBody: { "name"?: string; "category"?: string; "brief"?: string; "budget"?: number; "status"?: "DRAFT" | "REVIEW" | "LIVE" | "COMPLETED" | "CANCELLED"; "platforms"?: Array<string>; "countries"?: Array<string>; }; response: { "success": boolean; "data": unknown; "error": components["schemas"]["Error"]; "meta": {  } | null; }; };
delete: { response: { "success": boolean; "data": unknown; "error": components["schemas"]["Error"]; "meta": {  } | null; }; };
};
"/api/v1/campaigns/{id}/duplicate": {
post: { requestBody: {  }; response: { "success": boolean; "data": unknown; "error": components["schemas"]["Error"]; "meta": {  } | null; }; };
};
"/api/v1/campaigns/{id}/deliverables": {
post: { requestBody: { "platform": "Instagram" | "TikTok" | "YouTube"; "type": string; "quantity": number; "rewardMinor": number; }; response: { "success": boolean; "data": unknown; "error": components["schemas"]["Error"]; "meta": {  } | null; }; };
};
"/api/v1/creators": {
get: { response: { "success": boolean; "data": Array<components["schemas"]["Creator"]>; "error": components["schemas"]["Error"]; "meta": {  } | null; }; };
};
"/api/v1/creators/me": {
get: { response: { "success": boolean; "data": unknown; "error": components["schemas"]["Error"]; "meta": {  } | null; }; };
patch: { requestBody: { "handle"?: string; "country"?: string; "niche"?: string; "bio"?: string; "portfolio"?: Array<{ "url": string; "title": string; }>; }; response: { "success": boolean; "data": unknown; "error": components["schemas"]["Error"]; "meta": {  } | null; }; };
delete: { response: { "success": boolean; "data": unknown; "error": components["schemas"]["Error"]; "meta": {  } | null; }; };
};
"/api/v1/creators/onboarding": {
post: { requestBody: { "handle": string; "country": string; "niche": string; "bio"?: string; "currency"?: "USD" | "INR" | "EUR" | "GBP"; }; response: { "success": boolean; "data": unknown; "error": components["schemas"]["Error"]; "meta": {  } | null; }; };
};
"/api/v1/creators/payout-details": {
patch: { requestBody: { "method": "BANK" | "UPI" | "PAYPAL"; "accountName": string; "accountNumber"?: string; "ifsc"?: string; "upi"?: string; "paypal"?: string; }; response: { "success": boolean; "data": unknown; "error": components["schemas"]["Error"]; "meta": {  } | null; }; };
};
"/api/v1/campaigns/{id}/applications": {
post: { requestBody: { "pitch": string; }; response: { "success": boolean; "data": unknown; "error": components["schemas"]["Error"]; "meta": {  } | null; }; };
};
"/api/v1/applications": {
get: { response: { "success": boolean; "data": unknown; "error": components["schemas"]["Error"]; "meta": {  } | null; }; };
};
"/api/v1/applications/{id}/withdraw": {
post: { requestBody: {  }; response: { "success": boolean; "data": unknown; "error": components["schemas"]["Error"]; "meta": {  } | null; }; };
};
"/api/v1/applications/{id}": {
patch: { requestBody: { "status": "ACCEPTED" | "REJECTED" | "SHORTLISTED"; "rewardMinor"?: number; }; response: { "success": boolean; "data": unknown; "error": components["schemas"]["Error"]; "meta": {  } | null; }; };
};
"/api/v1/content": {
post: { requestBody: { "applicationId": string; "platform": "Instagram" | "TikTok" | "YouTube"; "postUrl": string; "videoUrl"?: string; "thumbnail"?: string; }; response: { "success": boolean; "data": unknown; "error": components["schemas"]["Error"]; "meta": {  } | null; }; };
get: { response: { "success": boolean; "data": unknown; "error": components["schemas"]["Error"]; "meta": {  } | null; }; };
};
"/api/v1/content/{id}/review": {
patch: { requestBody: { "status": "APPROVED" | "REJECTED" | "REVISION_REQUESTED"; "reason"?: string; }; response: { "success": boolean; "data": unknown; "error": components["schemas"]["Error"]; "meta": {  } | null; }; };
};
"/api/v1/content/{id}": {
patch: { requestBody: { "postUrl": string; "status": "SUBMITTED" | "LIVE"; }; response: { "success": boolean; "data": unknown; "error": components["schemas"]["Error"]; "meta": {  } | null; }; };
};
"/api/v1/campaigns/{id}/revenue": {
post: { requestBody: { "eventId": string; "creatorId"?: string; "platform": string; "country": string; "date": string; "revenueMinor": number; "spendMinor": number; "currency": "USD" | "INR" | "EUR" | "GBP"; }; response: { "success": boolean; "data": unknown; "error": components["schemas"]["Error"]; "meta": {  } | null; }; };
};
"/api/v1/analytics": {
get: { response: { "success": boolean; "data": components["schemas"]["Analytics"]; "error": components["schemas"]["Error"]; "meta": {  } | null; }; };
};
"/api/v1/analytics/export": {
get: { response: { "success": boolean; "data": unknown; "error": components["schemas"]["Error"]; "meta": {  } | null; }; };
};
"/api/v1/analytics/top-posts": {
get: { response: { "success": boolean; "data": unknown; "error": components["schemas"]["Error"]; "meta": {  } | null; }; };
};
"/api/v1/analytics/leaderboard": {
get: { response: { "success": boolean; "data": unknown; "error": components["schemas"]["Error"]; "meta": {  } | null; }; };
};
"/api/v1/creators/socials": {
post: { requestBody: { "platform": "Instagram" | "TikTok" | "YouTube"; "handle": string; "accessToken"?: string; }; response: { "success": boolean; "data": unknown; "error": components["schemas"]["Error"]; "meta": {  } | null; }; };
get: { response: { "success": boolean; "data": unknown; "error": components["schemas"]["Error"]; "meta": {  } | null; }; };
};
"/api/v1/creators/socials/{id}/verify": {
post: { requestBody: {  }; response: { "success": boolean; "data": unknown; "error": components["schemas"]["Error"]; "meta": {  } | null; }; };
};
"/api/v1/creators/socials/{id}": {
delete: { response: { "success": boolean; "data": unknown; "error": components["schemas"]["Error"]; "meta": {  } | null; }; };
};
"/api/v1/media/upload": {
post: { requestBody: { "mimeType": "image/jpeg" | "image/png" | "image/webp" | "video/mp4" | "application/pdf"; "sizeBytes": number; "alt": string; "section"?: string; }; response: { "success": boolean; "data": unknown; "error": components["schemas"]["Error"]; "meta": {  } | null; }; };
};
"/api/v1/media/{id}/complete": {
post: { requestBody: {  }; response: { "success": boolean; "data": unknown; "error": components["schemas"]["Error"]; "meta": {  } | null; }; };
};
"/api/v1/media/{id}": {
get: { response: { "success": boolean; "data": unknown; "error": components["schemas"]["Error"]; "meta": {  } | null; }; };
delete: { response: { "success": boolean; "data": unknown; "error": components["schemas"]["Error"]; "meta": {  } | null; }; };
};
"/api/v1/payments/checkout": {
post: { requestBody: { "provider": "stripe" | "razorpay"; "plan"?: "SELF_SERVICE" | "FULL_SERVICE"; "billing"?: "monthly" | "annual"; }; response: { "success": boolean; "data": unknown; "error": components["schemas"]["Error"]; "meta": {  } | null; }; };
};
"/api/v1/subscriptions/me": {
get: { response: { "success": boolean; "data": unknown; "error": components["schemas"]["Error"]; "meta": {  } | null; }; };
};
"/api/v1/subscriptions/cancel": {
post: { requestBody: {  }; response: { "success": boolean; "data": unknown; "error": components["schemas"]["Error"]; "meta": {  } | null; }; };
};
"/api/v1/subscriptions/plan": {
patch: { requestBody: { "billing": "monthly" | "annual"; "plan"?: "SELF_SERVICE" | "FULL_SERVICE"; }; response: { "success": boolean; "data": unknown; "error": components["schemas"]["Error"]; "meta": {  } | null; }; };
};
"/api/v1/payments/portal": {
post: { requestBody: {  }; response: { "success": boolean; "data": unknown; "error": components["schemas"]["Error"]; "meta": {  } | null; }; };
};
"/api/v1/invoices": {
get: { response: { "success": boolean; "data": unknown; "error": components["schemas"]["Error"]; "meta": {  } | null; }; };
};
"/api/v1/invoices/{id}/pdf": {
get: { response: { "success": boolean; "data": unknown; "error": components["schemas"]["Error"]; "meta": {  } | null; }; };
};
"/api/v1/admin/payments/{id}/refund": {
post: { requestBody: { "amountMinor": number; "reason": string; }; response: { "success": boolean; "data": unknown; "error": components["schemas"]["Error"]; "meta": {  } | null; }; };
};
"/api/v1/creators/earnings": {
get: { response: { "success": boolean; "data": unknown; "error": components["schemas"]["Error"]; "meta": {  } | null; }; };
};
"/api/v1/payouts": {
post: { requestBody: { "amountMinor": number; }; response: { "success": boolean; "data": unknown; "error": components["schemas"]["Error"]; "meta": {  } | null; }; };
get: { response: { "success": boolean; "data": unknown; "error": components["schemas"]["Error"]; "meta": {  } | null; }; };
};
"/api/v1/admin/payouts/{id}": {
patch: { requestBody: { "status": "APPROVED" | "PROCESSING" | "PAID" | "FAILED" | "REJECTED"; "reference"?: string; "reason"?: string; }; response: { "success": boolean; "data": unknown; "error": components["schemas"]["Error"]; "meta": {  } | null; }; };
};
"/api/v1/conversations": {
get: { response: { "success": boolean; "data": unknown; "error": components["schemas"]["Error"]; "meta": {  } | null; }; };
post: { requestBody: { "userId": string; }; response: { "success": boolean; "data": unknown; "error": components["schemas"]["Error"]; "meta": {  } | null; }; };
};
"/api/v1/conversations/{id}/messages": {
get: { response: { "success": boolean; "data": unknown; "error": components["schemas"]["Error"]; "meta": {  } | null; }; };
post: { requestBody: { "body"?: string; "attachmentIds"?: Array<string>; }; response: { "success": boolean; "data": unknown; "error": components["schemas"]["Error"]; "meta": {  } | null; }; };
};
"/api/v1/conversations/{id}/read": {
post: { requestBody: {  }; response: { "success": boolean; "data": unknown; "error": components["schemas"]["Error"]; "meta": {  } | null; }; };
};
"/api/v1/conversations/{id}/presence": {
get: { response: { "success": boolean; "data": unknown; "error": components["schemas"]["Error"]; "meta": {  } | null; }; };
};
"/api/v1/notifications": {
get: { response: { "success": boolean; "data": unknown; "error": components["schemas"]["Error"]; "meta": {  } | null; }; };
};
"/api/v1/notifications/{id}/read": {
patch: { requestBody: {  }; response: { "success": boolean; "data": unknown; "error": components["schemas"]["Error"]; "meta": {  } | null; }; };
};
"/api/v1/notifications/read-all": {
post: { requestBody: {  }; response: { "success": boolean; "data": unknown; "error": components["schemas"]["Error"]; "meta": {  } | null; }; };
};
"/api/v1/notifications/preferences": {
patch: { requestBody: { "inApp"?: boolean; "email"?: boolean; "mutedTypes"?: Array<string>; }; response: { "success": boolean; "data": unknown; "error": components["schemas"]["Error"]; "meta": {  } | null; }; };
};
"/api/v1/contact": {
post: { requestBody: { "name": string; "email": string; "message": string; }; response: { "success": boolean; "data": unknown; "error": components["schemas"]["Error"]; "meta": {  } | null; }; };
};
"/api/v1/creators/apply": {
post: { requestBody: { "name": string; "email": string; "country": string; "instagram": string; "tiktok": string; "niche": string; }; response: { "success": boolean; "data": unknown; "error": components["schemas"]["Error"]; "meta": {  } | null; }; };
};
"/api/v1/leads": {
post: { requestBody: { "email": string; "name"?: string; "source": string; "utmSource"?: string; "utmMedium"?: string; "utmCampaign"?: string; "utmTerm"?: string; "utmContent"?: string; }; response: { "success": boolean; "data": unknown; "error": components["schemas"]["Error"]; "meta": {  } | null; }; };
};
"/api/v1/newsletter": {
post: { requestBody: { "email": string; }; response: { "success": boolean; "data": unknown; "error": components["schemas"]["Error"]; "meta": {  } | null; }; };
};
"/api/v1/newsletter/confirm": {
post: { requestBody: { "token": string; }; response: { "success": boolean; "data": unknown; "error": components["schemas"]["Error"]; "meta": {  } | null; }; };
};
"/api/v1/newsletter/unsubscribe": {
post: { requestBody: { "token": string; }; response: { "success": boolean; "data": unknown; "error": components["schemas"]["Error"]; "meta": {  } | null; }; };
};
"/api/v1/testimonials": {
get: { response: { "success": boolean; "data": unknown; "error": components["schemas"]["Error"]; "meta": {  } | null; }; };
};
"/api/v1/faq": {
get: { response: { "success": boolean; "data": unknown; "error": components["schemas"]["Error"]; "meta": {  } | null; }; };
};
"/api/v1/pricing": {
get: { response: { "success": boolean; "data": unknown; "error": components["schemas"]["Error"]; "meta": {  } | null; }; };
};
"/api/v1/countries": {
get: { response: { "success": boolean; "data": unknown; "error": components["schemas"]["Error"]; "meta": {  } | null; }; };
};
"/api/v1/stats": {
get: { response: { "success": boolean; "data": unknown; "error": components["schemas"]["Error"]; "meta": {  } | null; }; };
};
"/api/v1/media/showcase": {
get: { response: { "success": boolean; "data": unknown; "error": components["schemas"]["Error"]; "meta": {  } | null; }; };
};
"/api/v1/sitemap": {
get: { response: { "success": boolean; "data": unknown; "error": components["schemas"]["Error"]; "meta": {  } | null; }; };
};
"/api/v1/bookings/slots": {
get: { response: { "success": boolean; "data": unknown; "error": components["schemas"]["Error"]; "meta": {  } | null; }; };
};
"/api/v1/bookings": {
post: { requestBody: { "name": string; "email": string; "brand": string; "date": string; "time": string; "timezone": string; "notes"?: string; }; response: { "success": boolean; "data": unknown; "error": components["schemas"]["Error"]; "meta": {  } | null; }; };
};
"/api/v1/bookings/{id}/cancel": {
post: { requestBody: { "token": string; }; response: { "success": boolean; "data": unknown; "error": components["schemas"]["Error"]; "meta": {  } | null; }; };
};
"/api/v1/bookings/{id}/reschedule": {
post: { requestBody: { "token": string; "date": string; "time": string; "timezone": string; }; response: { "success": boolean; "data": unknown; "error": components["schemas"]["Error"]; "meta": {  } | null; }; };
};
"/api/v1/admin/payouts/{id}/details": {
get: { response: { "success": boolean; "data": unknown; "error": components["schemas"]["Error"]; "meta": {  } | null; }; };
};
"/api/v1/admin/checkouts": {
get: { response: { "success": boolean; "data": unknown; "error": components["schemas"]["Error"]; "meta": {  } | null; }; };
};
"/api/v1/admin/checkouts/{id}/reconcile": {
patch: { requestBody: { "outcome": "CONFIRMED_NO_PROVIDER_OBJECT"; "reason": string; }; response: { "success": boolean; "data": unknown; "error": components["schemas"]["Error"]; "meta": {  } | null; }; };
};
"/api/v1/admin/users": {
get: { response: { "success": boolean; "data": unknown; "error": components["schemas"]["Error"]; "meta": {  } | null; }; };
};
"/api/v1/admin/users/{id}/status": {
patch: { requestBody: { "banned": boolean; "reason": string; }; response: { "success": boolean; "data": unknown; "error": components["schemas"]["Error"]; "meta": {  } | null; }; };
};
"/api/v1/admin/users/{id}/impersonate": {
post: { requestBody: { "reason": string; }; response: { "success": boolean; "data": unknown; "error": components["schemas"]["Error"]; "meta": {  } | null; }; };
};
"/api/v1/admin/creators/verification": {
get: { response: { "success": boolean; "data": unknown; "error": components["schemas"]["Error"]; "meta": {  } | null; }; };
};
"/api/v1/admin/creators/{id}/verify": {
patch: { requestBody: { "verified": boolean; }; response: { "success": boolean; "data": unknown; "error": components["schemas"]["Error"]; "meta": {  } | null; }; };
};
"/api/v1/admin/metrics": {
get: { response: { "success": boolean; "data": unknown; "error": components["schemas"]["Error"]; "meta": {  } | null; }; };
};
"/api/v1/admin/leads": {
get: { response: { "success": boolean; "data": unknown; "error": components["schemas"]["Error"]; "meta": {  } | null; }; };
};
"/api/v1/admin/contacts": {
get: { response: { "success": boolean; "data": unknown; "error": components["schemas"]["Error"]; "meta": {  } | null; }; };
};
"/api/v1/admin/calls": {
get: { response: { "success": boolean; "data": unknown; "error": components["schemas"]["Error"]; "meta": {  } | null; }; };
};
"/api/v1/admin/payouts": {
get: { response: { "success": boolean; "data": unknown; "error": components["schemas"]["Error"]; "meta": {  } | null; }; };
};
"/api/v1/admin/audit": {
get: { response: { "success": boolean; "data": unknown; "error": components["schemas"]["Error"]; "meta": {  } | null; }; };
};
"/api/v1/admin/content": {
get: { response: { "success": boolean; "data": unknown; "error": components["schemas"]["Error"]; "meta": {  } | null; }; };
};
"/api/v1/admin/campaigns": {
get: { response: { "success": boolean; "data": unknown; "error": components["schemas"]["Error"]; "meta": {  } | null; }; };
};
"/api/v1/admin/contacts/{id}": {
patch: { requestBody: { "status": "NEW" | "IN_PROGRESS" | "RESOLVED"; }; response: { "success": boolean; "data": unknown; "error": components["schemas"]["Error"]; "meta": {  } | null; }; };
};
"/api/v1/admin/leads/{id}": {
delete: { response: { "success": boolean; "data": unknown; "error": components["schemas"]["Error"]; "meta": {  } | null; }; };
};
"/api/v1/admin/calls/{id}": {
patch: { requestBody: { "status"?: "CONFIRMED" | "CANCELLED" | "COMPLETED"; "meetingLink"?: string; "notes"?: string; }; response: { "success": boolean; "data": unknown; "error": components["schemas"]["Error"]; "meta": {  } | null; }; };
};
"/api/v1/admin/availability": {
get: { response: { "success": boolean; "data": unknown; "error": components["schemas"]["Error"]; "meta": {  } | null; }; };
post: { requestBody: { "startsAt": string; "endsAt": string; }; response: { "success": boolean; "data": unknown; "error": components["schemas"]["Error"]; "meta": {  } | null; }; };
};
"/api/v1/admin/availability/{id}": {
patch: { requestBody: { "enabled": boolean; }; response: { "success": boolean; "data": unknown; "error": components["schemas"]["Error"]; "meta": {  } | null; }; };
};
"/api/v1/admin/site/testimonials": {
post: { requestBody: { "type": string; "quote": string; "tag": string; "initials": string; "color": string; "metric": string; "label": string; "order"?: number; }; response: { "success": boolean; "data": unknown; "error": components["schemas"]["Error"]; "meta": {  } | null; }; };
};
"/api/v1/admin/site/testimonials/{id}": {
patch: { requestBody: { "type"?: string; "quote"?: string; "tag"?: string; "initials"?: string; "color"?: string; "metric"?: string; "label"?: string; "order"?: number; }; response: { "success": boolean; "data": unknown; "error": components["schemas"]["Error"]; "meta": {  } | null; }; };
delete: { response: { "success": boolean; "data": unknown; "error": components["schemas"]["Error"]; "meta": {  } | null; }; };
};
"/api/v1/admin/site/faq": {
post: { requestBody: { "question": string; "answer": string; "order"?: number; }; response: { "success": boolean; "data": unknown; "error": components["schemas"]["Error"]; "meta": {  } | null; }; };
};
"/api/v1/admin/site/faq/{id}": {
patch: { requestBody: { "question"?: string; "answer"?: string; "order"?: number; }; response: { "success": boolean; "data": unknown; "error": components["schemas"]["Error"]; "meta": {  } | null; }; };
delete: { response: { "success": boolean; "data": unknown; "error": components["schemas"]["Error"]; "meta": {  } | null; }; };
};
"/api/v1/admin/site/pricing": {
post: { requestBody: { "plan": "SELF_SERVICE" | "FULL_SERVICE"; "name": string; "monthly": number; "annual": number; "currency": "USD" | "INR" | "EUR" | "GBP"; "features": Array<string>; "stripeMonthlyPriceId"?: string; "stripeAnnualPriceId"?: string; "razorpayMonthlyPlanId"?: string; "razorpayAnnualPlanId"?: string; }; response: { "success": boolean; "data": unknown; "error": components["schemas"]["Error"]; "meta": {  } | null; }; };
};
"/api/v1/admin/site/pricing/{id}": {
patch: { requestBody: { "plan"?: "SELF_SERVICE" | "FULL_SERVICE"; "name"?: string; "monthly"?: number; "annual"?: number; "currency"?: "USD" | "INR" | "EUR" | "GBP"; "features"?: Array<string>; "stripeMonthlyPriceId"?: string; "stripeAnnualPriceId"?: string; "razorpayMonthlyPlanId"?: string; "razorpayAnnualPlanId"?: string; }; response: { "success": boolean; "data": unknown; "error": components["schemas"]["Error"]; "meta": {  } | null; }; };
delete: { response: { "success": boolean; "data": unknown; "error": components["schemas"]["Error"]; "meta": {  } | null; }; };
};
"/api/v1/admin/site/stats": {
patch: { requestBody: { "creators": number; "views": number; "posts": number; "countries": number; }; response: { "success": boolean; "data": unknown; "error": components["schemas"]["Error"]; "meta": {  } | null; }; };
};
"/api/v1/admin/media": {
get: { response: { "success": boolean; "data": unknown; "error": components["schemas"]["Error"]; "meta": {  } | null; }; };
};
"/api/v1/admin/media/{id}": {
patch: { requestBody: { "section": string; "alt": string; "order"?: number; "showcase"?: boolean; "finalPath"?: string; "size"?: string; }; response: { "success": boolean; "data": unknown; "error": components["schemas"]["Error"]; "meta": {  } | null; }; };
};
"/api/v1/compliance/consent": {
post: { requestBody: { "anonymousId": string; "necessary": true; "analytics": boolean; "marketing": boolean; "version": string; }; response: { "success": boolean; "data": unknown; "error": components["schemas"]["Error"]; "meta": {  } | null; }; };
};
"/api/v1/compliance/terms": {
post: { requestBody: { "termsAccepted": true; "privacyAccepted": true; "version": string; }; response: { "success": boolean; "data": unknown; "error": components["schemas"]["Error"]; "meta": {  } | null; }; };
};
"/api/v1/compliance/export": {
get: { response: { "success": boolean; "data": unknown; "error": components["schemas"]["Error"]; "meta": {  } | null; }; };
};
"/api/v1/compliance/account": {
delete: { requestBody: { "confirmation": "DELETE"; "password"?: string; }; response: { "success": boolean; "data": unknown; "error": components["schemas"]["Error"]; "meta": {  } | null; }; };
};
"/api/v1/payments/webhooks/stripe": {
post: { response: unknown; };
};
"/api/v1/payments/webhooks/razorpay": {
post: { response: unknown; };
};
}
