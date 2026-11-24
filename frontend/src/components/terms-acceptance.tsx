'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { submit } from '@/lib/api';
import { Button } from './ui';
export function TermsAcceptance({version}:{version:string}){
 const [accepted,setAccepted]=useState(false);const [busy,setBusy]=useState(false);const [error,setError]=useState('');const router=useRouter();
 return <main id="main" className="auth-page"><form className="hive-form" onSubmit={async e=>{e.preventDefault();if(!accepted)return;setBusy(true);try{await submit('compliance/terms',{termsAccepted:true,privacyAccepted:true,version});router.push('/onboarding');}catch(err){setError(err instanceof Error?err.message:'Please try again.');}finally{setBusy(false);}}}><h1>Before we begin.</h1><label className="checkbox-label"><input type="checkbox" checked={accepted} onChange={e=>setAccepted(e.target.checked)}/><span>I accept the <Link href="/legal/terms">Terms</Link> and <Link href="/legal/privacy">Privacy Policy</Link>.</span></label><p role="alert">{error}</p><Button type="submit" disabled={!accepted||busy}>{busy?'Saving...':'Continue'}</Button></form></main>;
}
