import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { OnboardingForm } from '@/components/forms';
export const metadata: Metadata = { title: 'Let’s build your hive', robots: { index: false, follow: false } };
export default function Page() { if(!cookies().get('th_access')?.value&&!cookies().get('th_refresh')?.value) redirect('/signup'); return <main id="main" className="onboarding-page"><div className="onboarding-art" aria-hidden="true">YOUR<br/><em>NEXT.</em><span>STARTS HERE ↗</span></div><OnboardingForm/></main>; }
