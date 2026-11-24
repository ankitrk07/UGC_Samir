import type { Metadata } from 'next';
import { AuthPage } from '@/components/auth-page';
export const metadata: Metadata = { title: 'Start your 7-day free trial', robots: { index: false, follow: false } };
export default function Page({searchParams}:{searchParams:{billing?:string}}) { return <AuthPage mode="signup" selection={{plan:'self-service',billing:searchParams.billing==='annual'?'annual':'monthly'}}/>; }
