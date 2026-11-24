import type { Metadata } from 'next';
import { AuthPage } from '@/components/auth-page';
export const metadata: Metadata = { title: 'Reset your password', robots: { index: false, follow: false } };
export default function Page() { return <AuthPage mode="forgot"/>; }
