import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { allowedRoute, needsSession, isSameOrigin, publicAuthResponse, safeErrorMessage } from '@/lib/backend-policy.mjs';
import { backendTarget, boundedJsonBody, BridgeRequestError } from '@/lib/backend-request.mjs';
export const dynamic = 'force-dynamic';
const failure=(message:string,status:number)=>NextResponse.json({message},{status,headers:{'Cache-Control':'no-store'}});
const cookieOptions={httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax' as const,path:'/'};
async function handler(request:NextRequest,{params}:{params:{path:string[]}}){
 const endpoint=params.path.join('/');
 if(!allowedRoute(endpoint,request.method))return failure('This endpoint is not available.',404);
 if(!['GET','HEAD'].includes(request.method)&&!isSameOrigin(request.headers.get('origin'),request.url))return failure('This request must come from the same website.',403);
 const access=cookies().get('th_access')?.value;const refresh=cookies().get('th_refresh')?.value;
 if(needsSession(endpoint)&&!access&&!refresh)return failure('Log in to access your workspace.',401);
 const base=process.env.API_URL||process.env.NEXT_PUBLIC_API_URL;
 if(!base)return failure('The live service is not connected yet.',503);
 let target:URL;
 try{target=backendTarget(base,endpoint);}catch(error){return failure(error instanceof BridgeRequestError?error.message:'Invalid service configuration.',503);}
 for(const [k,v]of request.nextUrl.searchParams){if(k.length>100||v.length>2048)return failure('Invalid query.',400);target.searchParams.set(k,v);}
 let body:string|undefined;
 if(!['GET','HEAD'].includes(request.method)){
  try{const value=await boundedJsonBody(request);body=JSON.stringify(endpoint==='auth/refresh'?{refreshToken:refresh}:value);}catch(error){return failure(error instanceof BridgeRequestError?error.message:'Send valid JSON.',error instanceof BridgeRequestError?error.status:400);}
 }
 try{
  const upstream=await fetch(target,{method:request.method,headers:{'Content-Type':'application/json',...(access?{Authorization:'Bearer '+access}:{}),...(request.headers.get('Idempotency-Key')?{'Idempotency-Key':request.headers.get('Idempotency-Key')!}:{})},body,signal:AbortSignal.timeout(20000),cache:'no-store',redirect:'error'});
  if(upstream.ok&&upstream.headers.get('content-type')?.match(/text\/csv|application\/pdf/))return new NextResponse(upstream.body,{status:upstream.status,headers:{'Content-Type':upstream.headers.get('content-type')!,'Content-Disposition':upstream.headers.get('content-disposition')||'attachment','Cache-Control':'no-store'}});
  const envelope=await upstream.json();
  if(!upstream.ok){const response=failure(safeErrorMessage({message:envelope.error?.message},upstream.status),upstream.status);if(endpoint==='auth/refresh'&&upstream.status===401){response.cookies.set('th_access','',{...cookieOptions,maxAge:0});response.cookies.set('th_refresh','',{...cookieOptions,maxAge:0});}return response;}
  const data=envelope.data;
  if(['auth/login','auth/signup','auth/refresh','auth/me'].includes(endpoint)){
   const token=typeof data?.accessToken==='string'?data.accessToken:endpoint==='auth/me'?access:undefined;
   const response=NextResponse.json(publicAuthResponse(data,token),{headers:{'Cache-Control':'no-store'}});
   if(data?.accessToken)response.cookies.set('th_access',data.accessToken,{...cookieOptions,maxAge:900});
   if(data?.refreshToken)response.cookies.set('th_refresh',data.refreshToken,{...cookieOptions,maxAge:604800});return response;
  }
  const response=NextResponse.json(data,{headers:{'Cache-Control':'no-store'}});
  if(endpoint==='auth/logout'||endpoint==='auth/logout-all'){response.cookies.set('th_access','',{...cookieOptions,maxAge:0});response.cookies.set('th_refresh','',{...cookieOptions,maxAge:0});}return response;
 }catch{return failure('We could not reach the live service. Please try again.',503);}
}
export {handler as GET,handler as POST,handler as PATCH,handler as DELETE};
