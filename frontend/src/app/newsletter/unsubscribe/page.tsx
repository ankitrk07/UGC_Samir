import { Suspense } from 'react';
import { TokenAction } from '@/components/token-action';
export default function Page(){return <Suspense><TokenAction endpoint="newsletter/unsubscribe" title="Unsubscribe"/></Suspense>;}
