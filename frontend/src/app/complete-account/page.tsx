import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { TermsAcceptance } from '@/components/terms-acceptance';
export default function Page(){if(!cookies().get('th_refresh')?.value)redirect('/login');return <TermsAcceptance version={cookies().get('th_terms_version')?.value||'2026-11-11'}/>;}
