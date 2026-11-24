import type { Metadata } from 'next';
import { PricingCards } from '@/components/pricing';
import { FinalCTA } from '@/components/brand-page';
export const metadata: Metadata = { title: 'Pricing. Small commitment, big reach.', alternates: { canonical: '/pricing' } };
export default function Page() { return <main id="main"><PricingCards standalone/><FinalCTA/></main>; }
