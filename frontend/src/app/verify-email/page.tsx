import { Suspense } from 'react';
import { TokenAction } from '@/components/token-action';
export default function Page(){return <Suspense><TokenAction endpoint="auth/verify-email" title="Verify your email"/></Suspense>;}
