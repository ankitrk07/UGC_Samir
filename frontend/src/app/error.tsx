'use client';
import { Button } from '@/components/ui';
export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) { return <main id="main" className="not-found"><span className="eyebrow">A SMALL INTERRUPTION</span><h1>Lost a little<br/><em>momentum.</em></h1><p>The page couldn’t load. Let’s give it another go.</p><Button onClick={reset}>Try again</Button></main>; }
