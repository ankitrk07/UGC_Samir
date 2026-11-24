import type { Metadata } from 'next';
import { BookingForm } from '@/components/forms';
import { SectionLabel, HiveMark } from '@/components/ui';
import { Clock, Video, MessageCircle } from 'lucide-react';
export const metadata: Metadata = { title: 'Book a call. Talk to a real human.', alternates: { canonical: '/book-call' } };
export default function Page() { return <main id="main" className="split-page booking-page"><div className="split-story"><SectionLabel>LET’S SEE WHAT WE CAN START</SectionLabel><h1>Your next<br/>big thing.<br/><em>Our kind of call.</em></h1><p>Tell us what you’re building. We’ll show you how the right people can help it spread.</p><ul className="call-benefits"><li><Clock size={16}/>30 minutes, well spent</li><li><Video size={16}/>A real look at the platform</li><li><MessageCircle size={16}/>Ideas you can actually use</li></ul><div className="call-note"><HiveMark/><span>NO SALES THEATRE.<br/>JUST A GOOD CONVERSATION.</span></div></div><div className="form-card"><div className="form-card-heading"><span className="eyebrow">A DATE WITH POSSIBILITY</span><span>↗</span></div><BookingForm/></div></main>; }
