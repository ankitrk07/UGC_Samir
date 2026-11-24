import type { Metadata } from 'next';
import { BrandPage } from '@/components/brand-page';
export const metadata: Metadata = { title: 'Organic creator campaigns for brands', alternates: { canonical: '/for-brands' } };
export default function Page() { return <BrandPage/>; }
