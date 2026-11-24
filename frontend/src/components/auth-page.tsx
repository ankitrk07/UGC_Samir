import { LiveStat } from './live-stat';
import { AuthForm } from './forms';
import { HiveMark } from './ui';
import { ArrowUpRight } from 'lucide-react';
export function AuthPage({ mode, selection }: { mode: 'login' | 'signup' | 'forgot'; selection?: { plan: 'self-service'; billing: 'monthly' | 'annual' } }) {
 return <main id="main" className="auth-page"><div className="auth-art"><div className="auth-art-grid"/><div className="auth-art-hive"><HiveMark/></div><span className="eyebrow">INDEPENDENT VOICES. COLLECTIVE IMPACT.</span><h2>Good people.<br/>Unreal <em>reach.</em><ArrowUpRight/></h2><div className="auth-art-bottom"><span><LiveStat field="creators" fallback="250K+"/> CREATORS</span><span><LiveStat field="countries" fallback="60+"/> COUNTRIES</span><span>ZERO AD SPEND</span></div></div><div className="auth-form-wrap"><AuthForm mode={mode} selection={selection}/></div></main>;
}
