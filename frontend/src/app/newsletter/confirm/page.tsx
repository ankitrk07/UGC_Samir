import { Suspense } from 'react';
import { TokenAction } from '@/components/token-action';
export default function Page(){return <Suspense><TokenAction endpoint="newsletter/confirm" title="Confirm your subscription"/></Suspense>;}
