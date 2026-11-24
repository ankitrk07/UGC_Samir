import { z } from 'zod';
export const emailSchema = z.object({ email: z.string().trim().email('Use a valid email address.') });
export const loginSchema = emailSchema.extend({ password: z.string().min(1, 'Enter your password.') });
export const signupSchema = emailSchema.extend({
  name: z.string().trim().min(2, 'Tell us your name.').max(100),
  password: z.string().min(8, 'Use at least 8 characters.').max(128).regex(/[A-Z]/, 'Include an uppercase letter.').regex(/[0-9]/, 'Include a number.'),
  terms: z.literal(true, { errorMap: () => ({ message: 'Accept the terms to continue.' }) }),
});
export const bookingSchema = emailSchema.extend({ name: z.string().trim().min(2, 'Tell us your name.'), brand: z.string().trim().min(2, 'Add your brand name.'), date: z.string().min(1, 'Choose a day.').refine((s) => { const d = new Date(s + 'T00:00:00'); const now = new Date(); now.setHours(0, 0, 0, 0); return d >= now && d.getDay() !== 0 && d.getDay() !== 6; }, 'Choose a future weekday.'), time: z.string().min(1, 'Choose an available time.'), notes: z.string().max(1000).optional() });
export const contactSchema = emailSchema.extend({ name: z.string().trim().min(2, 'Tell us your name.'), message: z.string().trim().min(10, 'Give us a little more detail.').max(2000) });
export const onboardingSchema = z.object({ brand: z.string().trim().min(2, 'Add your brand name.'), website: z.string().url('Enter a complete URL, including https://.'), goal: z.enum(['Awareness', 'Product launch', 'Creator content', 'Sales']), budget: z.enum(['Under $1,000', '$1,000–$5,000', '$5,000–$15,000', '$15,000+']), countries: z.array(z.string()).min(1, 'Choose at least one market.'), platforms: z.array(z.string()).min(1, 'Choose at least one platform.') });
export const creatorSchema = emailSchema.extend({ name: z.string().trim().min(2, 'Tell us your name.'), country: z.string().min(2, 'Select your country.'), instagram: z.string().trim().regex(/^$|^@?[a-zA-Z0-9._]{2,50}$/, 'Use your handle, not a full profile URL.'), tiktok: z.string().trim().regex(/^$|^@?[a-zA-Z0-9._]{2,50}$/, 'Use your handle, not a full profile URL.'), niche: z.string().min(1, 'Choose a niche.') }).refine((s) => s.instagram.length > 1 || s.tiktok.length > 1, { message: 'Add at least one social handle.', path: ['instagram'] });
