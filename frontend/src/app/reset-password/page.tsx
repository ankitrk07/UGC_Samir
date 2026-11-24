import type { Metadata } from 'next';
import { ResetPasswordForm } from '@/components/reset-password';
export const metadata: Metadata = {title:'A fresh start',robots:{index:false,follow:false},referrer:'no-referrer'};
export default function Page({searchParams}:{searchParams:{token?:string}}){return <main id="main" className="reset-page"><ResetPasswordForm token={searchParams.token||''}/></main>;}
