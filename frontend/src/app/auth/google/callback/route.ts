import { NextRequest,NextResponse } from 'next/server';
import { cookies } from 'next/headers';
export const dynamic='force-dynamic';
export async function GET(request:NextRequest){
 const code=request.nextUrl.searchParams.get('code');if(!code||!/^[a-f0-9]{64}$/.test(code))return NextResponse.redirect(new URL('/login?oauth=invalid',request.url));
 const base=process.env.API_URL||process.env.NEXT_PUBLIC_API_URL;if(!base)return NextResponse.redirect(new URL('/login?oauth=unavailable',request.url));
 try{
  const upstream=await fetch(base.replace(/\/$/,'')+'/auth/google/exchange',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({code}),cache:'no-store',signal:AbortSignal.timeout(10000)});
  const result=await upstream.json();const data=result.data;const binding=cookies().get('th_oauth_frontend')?.value;
  if(!upstream.ok||!binding||data.frontendState!==binding||typeof data.accessToken!=='string'||typeof data.refreshToken!=='string')return NextResponse.redirect(new URL('/login?oauth=failed',request.url));
  const response=NextResponse.redirect(new URL(data.requiresTerms?'/complete-account':'/dashboard',request.url));
  const options={httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax' as const,path:'/'};
  response.cookies.set('th_access',data.accessToken,{...options,maxAge:900});response.cookies.set('th_refresh',data.refreshToken,{...options,maxAge:604800});
  response.cookies.set('th_terms_version',data.termsVersion,{...options,maxAge:3600});response.cookies.set('th_oauth_frontend','',{...options,maxAge:0});return response;
 }catch{return NextResponse.redirect(new URL('/login?oauth=unavailable',request.url));}
}
