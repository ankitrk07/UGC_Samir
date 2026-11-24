import type { Metadata } from 'next';
import { Dashboard } from '@/components/dashboard';
export const metadata: Metadata = { title: 'Explore the platform', robots: { index: false, follow: false } };
export default function Page() { return <Dashboard demo/>; }
