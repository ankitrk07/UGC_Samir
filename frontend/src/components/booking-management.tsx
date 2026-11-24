'use client';
import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { api,submit } from '@/lib/api';
import { Button } from './ui';
export function BookingManagement(){
 const params=useSearchParams();const [date,setDate]=useState('');const [time,setTime]=useState('');const [slots,setSlots]=useState<string[]>([]);const [message,setMessage]=useState('');const [busy,setBusy]=useState(false);const timezone=Intl.DateTimeFormat().resolvedOptions().timeZone;const id=params.get('id');const token=params.get('token');
 async function action(kind:'cancel'|'reschedule'){setBusy(true);try{await submit('bookings/'+encodeURIComponent(id||'')+'/'+kind,{token,...(kind==='reschedule'?{date,time,timezone}:{})});setMessage(kind==='cancel'?'Booking cancelled.':'Booking rescheduled. Check your email.');}catch(e){setMessage(e instanceof Error?e.message:'Request failed.');}finally{setBusy(false);}}
 return <main id="main" className="auth-page"><div className="auth-form-wrap"><h1>Manage your call</h1><p role="status">{message}</p><label>New date<input type="date" value={date} onChange={async e=>{const value=e.target.value;setDate(value);setTime('');setSlots([]);try{const r=await api<{slots:string[]}>('bookings/slots?date='+value+'&timezone='+encodeURIComponent(timezone));setSlots(r.slots);}catch(error){setMessage(error instanceof Error?error.message:'Availability unavailable.');}}}/></label><label>Time<select value={time} onChange={e=>setTime(e.target.value)}><option value="">Choose a time</option>{slots.map(s=><option key={s}>{s}</option>)}</select></label><Button disabled={busy||!id||!token||!time} onClick={()=>action('reschedule')}>Reschedule</Button><Button disabled={busy||!id||!token} onClick={()=>action('cancel')}>Cancel booking</Button></div></main>;
}
