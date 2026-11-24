import type { Metadata } from 'next';
import { AuthPage } from '@/components/auth-page';
export const metadata: Metadata = { title: 'Log in to your hive', robots: { index: false, follow: false } };
export default function Page() { return <AuthPage mode="login"/>; }
