import { NextResponse } from 'next/server';
import { randomBytes } from 'node:crypto';
export const dynamic='force-dynamic';
export function GET(){
 const binding=randomBytes(32).toString('hex');
 const base=process.env.NEXT_PUBLIC_API_URL||'http://localhost:4000/api/v1';
 const target=new URL(base.replace(/\/$/,'')+'/auth/google');target.searchParams.set('frontendState',binding);
 const response=NextResponse.redirect(target);
 response.cookies.set('th_oauth_frontend',binding,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:600});return response;
}
