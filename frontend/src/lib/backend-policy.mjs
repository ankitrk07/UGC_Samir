/** Shared, dependency-free policy for the same-origin REST bridge. */
const routes = new Map([
 ['auth/login', ['POST']], ['auth/signup', ['POST']], ['auth/forgot-password', ['POST']], ['auth/reset-password', ['POST']], ['auth/logout', ['POST']], ['auth/me', ['GET']], ['auth/refresh',['POST']], ['auth/verify-email',['POST']], ['auth/resend-verification',['POST']], ['compliance/terms',['POST']],
 ['bookings', ['POST']], ['bookings/slots', ['GET']], ['brand/onboarding', ['POST','PATCH']], ['creators/apply', ['POST']], ['newsletter', ['POST']], ['contact', ['POST']],
 ['campaigns', ['GET','POST']], ['creators', ['GET']], ['analytics', ['GET']], ['analytics/export',['GET']], ['notifications',['GET']], ['pricing',['GET']], ['faq',['GET']], ['testimonials',['GET']], ['stats',['GET']], ['media/showcase',['GET']], ['countries',['GET']], ['newsletter/confirm',['POST']], ['newsletter/unsubscribe',['POST']],
]);
export function allowedRoute(path, method) { return routes.get(path)?.includes(method) || (/^bookings\/[a-zA-Z0-9]+\/(cancel|reschedule)$/.test(path) && method === 'POST') || (/^notifications\/[a-zA-Z0-9_-]+\/read$/.test(path) && method === 'PATCH'); }
export function needsSession(path) { return ['brand/onboarding','campaigns','creators','analytics','analytics/export','notifications','auth/me','compliance/terms'].includes(path); }
export function isSameOrigin(origin, target) { if (!origin) return false; try { return new URL(origin).origin === new URL(target).origin; } catch { return false; } }
export function sessionMaxAge(seconds) { const n=Number(seconds); return Number.isFinite(n)&&n>0 ? Math.max(1,Math.min(604800,Math.floor(n))) : 86400; }
export function publicAuthResponse(data, token) {
 const raw=data?.user;
 const user=raw&&typeof raw==='object'?Object.fromEntries(['id','name','email','role'].filter(k=>typeof raw[k]==='string').map(k=>[k,raw[k]])):undefined;
 return { authenticated: !!token, ...(user?{user}:{}), ...(typeof data?.message==='string'?{message:data.message}:{}) };
}
export function safeErrorMessage(data, status) {
 if(status>=500)return 'The service is taking a moment. Please try again shortly.';
 return typeof data?.message==='string'?data.message.slice(0,300):status===401?'Your session has expired. Please log in again.':status===409?'That request conflicts with an existing record. Please check and try again.':'Please check your details and try again.';
}
