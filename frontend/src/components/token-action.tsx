'use client';
import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { submit } from '@/lib/api';
import { Button } from './ui';
export function TokenAction({endpoint,title}:{endpoint:string;title:string}){
 const params=useSearchParams();const [message,setMessage]=useState('');const [busy,setBusy]=useState(false);
 return <main id="main" className="auth-page"><div className="auth-form-wrap"><h1>{title}</h1><p role="status">{message}</p><Button disabled={busy||!params.get('token')} onClick={async()=>{setBusy(true);try{const r=await submit<{message:string}>(endpoint,{token:params.get('token')});setMessage(r.message);}catch(e){setMessage(e instanceof Error?e.message:'Request failed.');}finally{setBusy(false);}}}>{busy?'Please wait?':'Confirm'}</Button></div></main>;
}
