import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Dashboard } from '@/components/dashboard';
export const metadata: Metadata = { title: 'Your control room', robots: { index: false, follow: false } };
export default function Page() { if(!cookies().get('th_access')?.value&&!cookies().get('th_refresh')?.value)redirect('/login');return <Dashboard/>; }
