# Frontend source inventory

Generated from the integrated frontend. The pre-implementation inventory and endpoint mapping are in API-CONTRACT.md. Each row identifies an actual form, button/action, network call, schema call, store use or fixture reference. Nested Zod calls expose validation boundaries. Presentation-only actions do not each need an endpoint.

| Kind | File:line | Source / action |
|---|---|---|
| API / fetch | frontend/src/app/api/backend/[...path]/route.ts:24 | fetch(target,{method:request.method,headers:{'Content-Type':'application/json',...(access?{Authorization:'Bearer '+access}:{}),...(request.headers.get('Idempotency-Key')?{'Idempotency-Key':request.headers.get('Idempotency-Key')!}:{})},body, |
| API / fetch | frontend/src/app/auth/google/callback/route.ts:8 | fetch(base.replace(/\/$/,'')+'/auth/google/exchange',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({code}),cache:'no-store',signal:AbortSignal.timeout(10000)}) |
| Button / click action | frontend/src/app/error.tsx:3 | Button onClick={reset} |
| Button / click action | frontend/src/app/for-creators/page.tsx:10 | Button href="#apply" |
| Button / click action | frontend/src/app/not-found.tsx:2 | Button href="/for-brands" |
| Mock / fallback | frontend/src/app/sitemap.ts:2 | fallback |
| API / fetch | frontend/src/app/sitemap.ts:5 | fetch(api.replace(/\/$/,'')+'/sitemap',{next:{revalidate:3600},signal:AbortSignal.timeout(5000)}) |
| Mock / fallback | frontend/src/app/sitemap.ts:5 | fallback.includes(x) |
| Store / fixture import | frontend/src/components/analytics-preview.tsx:7 | import { campaignData, type Analytics } from '@/lib/data'; |
| Button / click action | frontend/src/components/analytics-preview.tsx:19 | button onClick={() => setMetric(m)} |
| API / fetch | frontend/src/components/booking-management.tsx:9 | api<{slots:string[]}>('bookings/slots?date='+value+'&timezone='+encodeURIComponent(timezone)) |
| Button / click action | frontend/src/components/booking-management.tsx:9 | Button disabled={busy&#124;&#124;!id&#124;&#124;!token&#124;&#124;!time} onClick={()=>action('reschedule')} |
| Button / click action | frontend/src/components/booking-management.tsx:9 | Button disabled={busy&#124;&#124;!id&#124;&#124;!token} onClick={()=>action('cancel')} |
| Button / click action | frontend/src/components/brand-page.tsx:52 | button onClick={() => setStep(i)} |
| Button / click action | frontend/src/components/brand-page.tsx:108 | button onClick={()=>setIndex((index+stories.length-1)%stories.length)} |
| Button / click action | frontend/src/components/brand-page.tsx:108 | button onClick={()=>setIndex((index+1)%stories.length)} |
| Button / click action | frontend/src/components/brand-page.tsx:108 | button onClick={()=>setPaused(!paused)} |
| Button / click action | frontend/src/components/brand-page.tsx:140 | Button href="/signup" |
| Store / fixture import | frontend/src/components/dashboard.tsx:13 | import { mockCampaigns, mockCreators, mockAnalytics, type Campaign, type Creator, type Analytics } from '@/lib/data'; |
| Zod validation | frontend/src/components/dashboard.tsx:22 | z.object({name:z.string().trim().min(3,'Give your campaign a name.').max(80),category:z.string().min(1,'Choose a category.'),budget:z.coerce.number().min(1,'Enter a budget above zero.').max(1000000),brief:z.string().trim().min(20,'Add a bri |
| Zod validation | frontend/src/components/dashboard.tsx:22 | z.string().trim().min(3,'Give your campaign a name.').max(80) |
| Zod validation | frontend/src/components/dashboard.tsx:22 | z.string().trim().min(3,'Give your campaign a name.') |
| Zod validation | frontend/src/components/dashboard.tsx:22 | z.string().trim() |
| Zod validation | frontend/src/components/dashboard.tsx:22 | z.string() |
| Zod validation | frontend/src/components/dashboard.tsx:22 | z.string().min(1,'Choose a category.') |
| Zod validation | frontend/src/components/dashboard.tsx:22 | z.coerce.number().min(1,'Enter a budget above zero.').max(1000000) |
| Zod validation | frontend/src/components/dashboard.tsx:22 | z.coerce.number().min(1,'Enter a budget above zero.') |
| Zod validation | frontend/src/components/dashboard.tsx:22 | z.coerce.number() |
| Zod validation | frontend/src/components/dashboard.tsx:22 | z.string().trim().min(20,'Add a brief of at least 20 characters.').max(3000) |
| Zod validation | frontend/src/components/dashboard.tsx:22 | z.string().trim().min(20,'Add a brief of at least 20 characters.') |
| Form | frontend/src/components/dashboard.tsx:25 | onSubmit={handleSubmit(async(data)=>{setError('');try{const result:Campaign=demo?{id:'DEMO-'+Date.now(),name:data.name,category:data.category,budget:data.budget,status:'Review',creators:0,views:0}:await submit<Campaign>('campaigns',data);on |
| Button / click action | frontend/src/components/dashboard.tsx:25 | Button type="submit" disabled={isSubmitting} |
| Mock / fallback | frontend/src/components/dashboard.tsx:28 | [fallback,setFallback] |
| Mock / fallback | frontend/src/components/dashboard.tsx:34 | Promise.allSettled([api<Campaign[]>('campaigns',{signal:ctrl.signal}),api<Creator[]>('creators',{signal:ctrl.signal}),api<Analytics>('analytics',{signal:ctrl.signal}),api<{user:{name:string}}>('auth/me',{signal:ctrl.signal})]).then(results= |
| API / fetch | frontend/src/components/dashboard.tsx:34 | api<Campaign[]>('campaigns',{signal:ctrl.signal}) |
| API / fetch | frontend/src/components/dashboard.tsx:34 | api<Creator[]>('creators',{signal:ctrl.signal}) |
| API / fetch | frontend/src/components/dashboard.tsx:34 | api<Analytics>('analytics',{signal:ctrl.signal}) |
| API / fetch | frontend/src/components/dashboard.tsx:34 | api<{user:{name:string}}>('auth/me',{signal:ctrl.signal}) |
| Mock / fallback | frontend/src/components/dashboard.tsx:43 | setFallback(anyFailed) |
| API / fetch | frontend/src/components/dashboard.tsx:47 | api<typeof notificationItems>('notifications',{signal:ctrl.signal}) |
| API / fetch | frontend/src/components/dashboard.tsx:52 | fetch('/api/backend/analytics/export?format=csv',{credentials:'same-origin'}) |
| Button / click action | frontend/src/components/dashboard.tsx:56 | button onClick={()=>setMobile(false)} |
| Button / click action | frontend/src/components/dashboard.tsx:56 | button onClick={()=>toast(demo?'You’re exploring the demo workspace.':'This is your active brand workspace.')} |
| Button / click action | frontend/src/components/dashboard.tsx:56 | button onClick={()=>change(name)} |
| Button / click action | frontend/src/components/dashboard.tsx:56 | button onClick={()=>setMobile(!mobile)} |
| Button / click action | frontend/src/components/dashboard.tsx:56 | button onClick={()=>setNotifications(true)} |
| Button / click action | frontend/src/components/dashboard.tsx:56 | button disabled={logoutLoading} onClick={async()=>{setLogoutLoading(true);try{await submit('auth/logout',{});router.push('/login');router.refresh();}catch(e){toast(e instanceof Error?e.message:'Logout failed. Please retry.','error');setLogo |
| Button / click action | frontend/src/components/dashboard.tsx:56 | button onClick={()=>setRefresh(refresh+1)} disabled={loading} |
| Button / click action | frontend/src/components/dashboard.tsx:56 | button onClick={exportData} |
| Button / click action | frontend/src/components/dashboard.tsx:56 | Button onClick={()=>setCreate(true)} |
| Button / click action | frontend/src/components/dashboard.tsx:56 | button onClick={()=>change('Campaigns')} |
| Button / click action | frontend/src/components/dashboard.tsx:56 | button onClick={()=>setSelected(c)} |
| Button / click action | frontend/src/components/dashboard.tsx:56 | button onClick={()=>{setQuery('');setFilter('All');}} |
| Button / click action | frontend/src/components/dashboard.tsx:56 | button onClick={()=>setCreate(true)} |
| Button / click action | frontend/src/components/dashboard.tsx:56 | button onClick={()=>setCreator(c)} |
| Button / click action | frontend/src/components/dashboard.tsx:56 | Button onClick={()=>{setCreator(null);setCreate(true);}} |
| Button / click action | frontend/src/components/dashboard.tsx:56 | button disabled={!!n.readAt} onClick={async()=>{try{await api("notifications/"+n.id+"/read",{method:"PATCH",body:"{}"});setNotificationItems(items=>items.map(item=>item.id===n.id?{...item,readAt:new Date().toISOString()}:item));}catch(e){to |
| API / fetch | frontend/src/components/dashboard.tsx:56 | api("notifications/"+n.id+"/read",{method:"PATCH",body:"{}"}) |
| Form | frontend/src/components/forms.tsx:22 | onSubmit={handleSubmit(async(data)=>{try{await submit('newsletter',data);toast('You’re on the list. Good things are coming.');reset();}catch(e){toast(errorMessage(e),'error');}})} |
| Button / click action | frontend/src/components/forms.tsx:22 | button type="submit" disabled={isSubmitting} |
| Form | frontend/src/components/forms.tsx:30 | onSubmit={handleSubmit(async(data)=>{ setServerError(''); try { const payload=isSignup?{name:data.name,email:data.email,password:data.password,termsAccepted:data.terms,...selection}:{email:data.email,...(!isForgot?{password:data.password}:{ |
| Button / click action | frontend/src/components/forms.tsx:45 | button type="button" onClick={()=>setShow(!show)} |
| Button / click action | frontend/src/components/forms.tsx:48 | Button type="submit" disabled={isSubmitting} |
| API / fetch | frontend/src/components/forms.tsx:59 | api<{slots:string[]}>('bookings/slots?date='+encodeURIComponent(date)+'&timezone='+encodeURIComponent(timezone),{signal:ctrl.signal}) |
| Form | frontend/src/components/forms.tsx:62 | onSubmit={handleSubmit(async(data)=>{setServerError('');try{await submit('bookings',{...data,timezone});setDone(true);toast('Your booking request is in.');}catch(e){setServerError(errorMessage(e));}})} |
| Button / click action | frontend/src/components/forms.tsx:62 | button type="button" onClick={()=>setValue('time',t,{shouldValidate:true})} |
| Button / click action | frontend/src/components/forms.tsx:62 | button type="button" onClick={()=>setRetry(retry+1)} |
| Button / click action | frontend/src/components/forms.tsx:62 | Button type="submit" disabled={isSubmitting} |
| Form | frontend/src/components/forms.tsx:68 | onSubmit={handleSubmit(async(data)=>{setServerError('');try{await submit('creators/apply',data);setDone(true);}catch(e){setServerError(errorMessage(e));}})} |
| Button / click action | frontend/src/components/forms.tsx:68 | Button type="submit" disabled={isSubmitting} |
| Form | frontend/src/components/forms.tsx:74 | onSubmit={handleSubmit(async(data)=>{try{await submit('contact',data);setDone(true);}catch(e){toast(errorMessage(e),'error');}})} |
| Button / click action | frontend/src/components/forms.tsx:74 | Button type="submit" disabled={isSubmitting} |
| API / fetch | frontend/src/components/forms.tsx:80 | api('brand/onboarding',{method:'PATCH',body:JSON.stringify(Object.fromEntries(fields.map(f=>[f,values[f]])))}) |
| Form | frontend/src/components/forms.tsx:82 | onSubmit={handleSubmit(async(data)=>{if(step!==2)return;setServerError('');try{await submit('brand/onboarding',data);router.push('/dashboard');}catch(e){setServerError(errorMessage(e));}})} |
| Button / click action | frontend/src/components/forms.tsx:82 | button type="button" onClick={()=>toggle('countries',c)} |
| Button / click action | frontend/src/components/forms.tsx:82 | button type="button" onClick={()=>toggle('platforms',c)} |
| Button / click action | frontend/src/components/forms.tsx:82 | button type="button" onClick={()=>setStep(step-1)} |
| Button / click action | frontend/src/components/forms.tsx:82 | Button type="button" onClick={next} |
| Button / click action | frontend/src/components/forms.tsx:82 | Button type="submit" disabled={isSubmitting} |
| Button / click action | frontend/src/components/hero.tsx:36 | Button href="/signup" |
| Button / click action | frontend/src/components/hero.tsx:36 | Button href="/book-call" |
| Button / click action | frontend/src/components/modal.tsx:9 | div onClick={e=>{if(e.target===e.currentTarget)close();}} |
| Button / click action | frontend/src/components/modal.tsx:9 | button onClick={close} |
| Button / click action | frontend/src/components/pricing.tsx:14 | button onClick={()=>setAnnual(false)} |
| Button / click action | frontend/src/components/pricing.tsx:14 | button onClick={()=>setAnnual(true)} |
| Button / click action | frontend/src/components/pricing.tsx:16 | Button href={'/signup?plan=self-service&billing='+(annual?'annual':'monthly')} |
| Button / click action | frontend/src/components/pricing.tsx:17 | Button href="/book-call" |
| Button / click action | frontend/src/components/pricing.tsx:27 | button onClick={()=>setOpen(open===i?null:i)} |
| API / fetch | frontend/src/components/public-data.tsx:12 | api(path,{signal:ctrl.signal}) |
| Zod validation | frontend/src/components/reset-password.tsx:10 | z.object({password:signupSchema.shape.password,confirm:z.string()}).refine(v=>v.password===v.confirm,{message:'Your passwords don’t match.',path:['confirm']}) |
| Zod validation | frontend/src/components/reset-password.tsx:10 | z.object({password:signupSchema.shape.password,confirm:z.string()}) |
| Zod validation | frontend/src/components/reset-password.tsx:10 | z.string() |
| Button / click action | frontend/src/components/reset-password.tsx:14 | Button href="/forgot-password" |
| Button / click action | frontend/src/components/reset-password.tsx:15 | Button href="/login" |
| Form | frontend/src/components/reset-password.tsx:16 | onSubmit={handleSubmit(async(data)=>{setError('');try{await submit('auth/reset-password',{token,password:data.password});setDone(true);}catch(e){setError(e instanceof Error?e.message:'Please try again.');}})} |
| Button / click action | frontend/src/components/reset-password.tsx:16 | Button type="submit" disabled={isSubmitting} |
| Button / click action | frontend/src/components/shell.tsx:70 | button onClick={() => setMenuOpen(true)} |
| Button / click action | frontend/src/components/shell.tsx:70 | button onClick={() => setMenuOpen(false)} |
| Form | frontend/src/components/terms-acceptance.tsx:9 | onSubmit={async e=>{e.preventDefault();if(!accepted)return;setBusy(true);try{await submit('compliance/terms',{termsAccepted:true,privacyAccepted:true,version});router.push('/onboarding');}catch(err){setError(err instanceof Error?err.message |
| Button / click action | frontend/src/components/terms-acceptance.tsx:9 | Button type="submit" disabled={!accepted&#124;&#124;busy} |
| Button / click action | frontend/src/components/theme-provider.tsx:51 | button type="button" onClick={toggleTheme} |
| Button / click action | frontend/src/components/token-action.tsx:8 | Button disabled={busy&#124;&#124;!params.get('token')} onClick={async()=>{setBusy(true);try{const r=await submit<{message:string}>(endpoint,{token:params.get('token')});setMessage(r.message);}catch(e){setMessage(e instanceof Error?e.message:'Request  |
| Button / click action | frontend/src/components/ui.tsx:14 | button  |
| Button / click action | frontend/src/components/ui.tsx:20 | button onClick={() => dismiss(t.id)} |
| Button / click action | frontend/src/components/video-card.tsx:29 | button onClick={() => { setLoaded(true); setActive(!active); }} |
| API / fetch | frontend/src/lib/api.ts:3 | fetch('/api/backend/auth/me',{credentials:'same-origin'}) |
| API / fetch | frontend/src/lib/api.ts:3 | fetch('/api/backend/auth/refresh',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}',credentials:'same-origin'}) |
| API / fetch | frontend/src/lib/api.ts:5 | fetch('/api/backend/'+path.replace(/^\//,''),{...options,credentials:'same-origin',headers:{'Content-Type':'application/json',...options.headers}}) |
| API / fetch | frontend/src/lib/api.ts:14 | api<T>(path,{method:'POST',body:JSON.stringify(data)}) |
| Mock / fallback | frontend/src/lib/data.ts:6 | mockCampaigns |
| Mock / fallback | frontend/src/lib/data.ts:12 | mockCreators |
| Mock / fallback | frontend/src/lib/data.ts:21 | mockAnalytics |
| Zod validation | frontend/src/lib/schemas.ts:2 | z.object({ email: z.string().trim().email('Use a valid email address.') }) |
| Zod validation | frontend/src/lib/schemas.ts:2 | z.string().trim().email('Use a valid email address.') |
| Zod validation | frontend/src/lib/schemas.ts:2 | z.string().trim() |
| Zod validation | frontend/src/lib/schemas.ts:2 | z.string() |
| Zod validation | frontend/src/lib/schemas.ts:3 | z.string().min(1, 'Enter your password.') |
| Zod validation | frontend/src/lib/schemas.ts:3 | z.string() |
| Zod validation | frontend/src/lib/schemas.ts:5 | z.string().trim().min(2, 'Tell us your name.').max(100) |
| Zod validation | frontend/src/lib/schemas.ts:5 | z.string().trim().min(2, 'Tell us your name.') |
| Zod validation | frontend/src/lib/schemas.ts:5 | z.string().trim() |
| Zod validation | frontend/src/lib/schemas.ts:5 | z.string() |
| Zod validation | frontend/src/lib/schemas.ts:6 | z.string().min(8, 'Use at least 8 characters.').max(128).regex(/[A-Z]/, 'Include an uppercase letter.').regex(/[0-9]/, 'Include a number.') |
| Zod validation | frontend/src/lib/schemas.ts:6 | z.string().min(8, 'Use at least 8 characters.').max(128).regex(/[A-Z]/, 'Include an uppercase letter.') |
| Zod validation | frontend/src/lib/schemas.ts:6 | z.string().min(8, 'Use at least 8 characters.').max(128) |
| Zod validation | frontend/src/lib/schemas.ts:6 | z.string().min(8, 'Use at least 8 characters.') |
| Zod validation | frontend/src/lib/schemas.ts:6 | z.string() |
| Zod validation | frontend/src/lib/schemas.ts:7 | z.literal(true, { errorMap: () => ({ message: 'Accept the terms to continue.' }) }) |
| Zod validation | frontend/src/lib/schemas.ts:9 | z.string().trim().min(2, 'Tell us your name.') |
| Zod validation | frontend/src/lib/schemas.ts:9 | z.string().trim() |
| Zod validation | frontend/src/lib/schemas.ts:9 | z.string() |
| Zod validation | frontend/src/lib/schemas.ts:9 | z.string().trim().min(2, 'Add your brand name.') |
| Zod validation | frontend/src/lib/schemas.ts:9 | z.string().min(1, 'Choose a day.').refine((s) => { const d = new Date(s + 'T00:00:00'); const now = new Date(); now.setHours(0, 0, 0, 0); return d >= now && d.getDay() !== 0 && d.getDay() !== 6; }, 'Choose a future weekday.') |
| Zod validation | frontend/src/lib/schemas.ts:9 | z.string().min(1, 'Choose a day.') |
| Zod validation | frontend/src/lib/schemas.ts:9 | z.string().min(1, 'Choose an available time.') |
| Zod validation | frontend/src/lib/schemas.ts:9 | z.string().max(1000).optional() |
| Zod validation | frontend/src/lib/schemas.ts:9 | z.string().max(1000) |
| Zod validation | frontend/src/lib/schemas.ts:10 | z.string().trim().min(2, 'Tell us your name.') |
| Zod validation | frontend/src/lib/schemas.ts:10 | z.string().trim() |
| Zod validation | frontend/src/lib/schemas.ts:10 | z.string() |
| Zod validation | frontend/src/lib/schemas.ts:10 | z.string().trim().min(10, 'Give us a little more detail.').max(2000) |
| Zod validation | frontend/src/lib/schemas.ts:10 | z.string().trim().min(10, 'Give us a little more detail.') |
| Zod validation | frontend/src/lib/schemas.ts:11 | z.object({ brand: z.string().trim().min(2, 'Add your brand name.'), website: z.string().url('Enter a complete URL, including https://.'), goal: z.enum(['Awareness', 'Product launch', 'Creator content', 'Sales']), budget: z.enum(['Under $1,0 |
| Zod validation | frontend/src/lib/schemas.ts:11 | z.string().trim().min(2, 'Add your brand name.') |
| Zod validation | frontend/src/lib/schemas.ts:11 | z.string().trim() |
| Zod validation | frontend/src/lib/schemas.ts:11 | z.string() |
| Zod validation | frontend/src/lib/schemas.ts:11 | z.string().url('Enter a complete URL, including https://.') |
| Zod validation | frontend/src/lib/schemas.ts:11 | z.enum(['Awareness', 'Product launch', 'Creator content', 'Sales']) |
| Zod validation | frontend/src/lib/schemas.ts:11 | z.enum(['Under $1,000', '$1,000–$5,000', '$5,000–$15,000', '$15,000+']) |
| Zod validation | frontend/src/lib/schemas.ts:11 | z.array(z.string()).min(1, 'Choose at least one market.') |
| Zod validation | frontend/src/lib/schemas.ts:11 | z.array(z.string()) |
| Zod validation | frontend/src/lib/schemas.ts:11 | z.array(z.string()).min(1, 'Choose at least one platform.') |
| Zod validation | frontend/src/lib/schemas.ts:12 | z.string().trim().min(2, 'Tell us your name.') |
| Zod validation | frontend/src/lib/schemas.ts:12 | z.string().trim() |
| Zod validation | frontend/src/lib/schemas.ts:12 | z.string() |
| Zod validation | frontend/src/lib/schemas.ts:12 | z.string().min(2, 'Select your country.') |
| Zod validation | frontend/src/lib/schemas.ts:12 | z.string().trim().regex(/^$&#124;^@?[a-zA-Z0-9._]{2,50}$/, 'Use your handle, not a full profile URL.') |
| Zod validation | frontend/src/lib/schemas.ts:12 | z.string().min(1, 'Choose a niche.') |
| Store / fixture import | frontend/src/store/ui.ts:2 | import { create } from 'zustand'; |
| Store call | frontend/src/store/ui.ts:6 | create<UI>((set) => ({ menuOpen: false, setMenuOpen: (menuOpen) => set({ menuOpen }), annual: false, setAnnual: (annual) => set({ annual }), toasts: [], toast: (message, kind = 'success') => { const id = ++toastId; set((s) => ({ toasts: [.. |
