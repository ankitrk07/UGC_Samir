import type { MetadataRoute } from 'next';
const fallback=['/for-brands','/for-creators','/pricing','/book-call','/contact'];
export default async function sitemap():Promise<MetadataRoute.Sitemap>{
 const site=process.env.NEXT_PUBLIC_SITE_URL||'http://localhost:3000';const api=process.env.API_URL||process.env.NEXT_PUBLIC_API_URL;let paths=fallback;
 if(api)try{const response=await fetch(api.replace(/\/$/,'')+'/sitemap',{next:{revalidate:3600},signal:AbortSignal.timeout(5000)});if(response.ok){const result=await response.json();if(Array.isArray(result.data?.paths))paths=result.data.paths.filter((x:unknown):x is string=>typeof x==='string'&&fallback.includes(x));}}catch{}
 return paths.map(p=>({url:site+p,changeFrequency:'monthly',priority:p==='/for-brands'?1:.8}));
}
