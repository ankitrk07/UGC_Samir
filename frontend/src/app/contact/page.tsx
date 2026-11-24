import type { Metadata } from 'next';
import { ContactForm } from '@/components/forms';
import { SectionLabel } from '@/components/ui';
export const metadata: Metadata = { title: 'Say hello', alternates: { canonical: '/contact' } };
export default function Page() { return <main id="main" className="split-page"><div className="split-story"><SectionLabel>WE’RE GOOD LISTENERS</SectionLabel><h1>Big idea?<br/>Small question?<br/><em>Say hello.</em></h1><p>Brand, creator, curious human. There’s room in the hive for a good conversation.</p></div><div className="form-card"><ContactForm/></div></main>; }
