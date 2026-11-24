'use client';
import Link from 'next/link';
import { ArrowUpRight, Check, X } from 'lucide-react';
import { useMagnetic } from '@/hooks/useMagnetic';
import { useUI } from '@/store/ui';
import { AnimatePresence, motion } from 'framer-motion';
export function HiveMark({ className = '' }: { className?: string }) {
  return <svg className={className} viewBox="0 0 40 40" fill="none" aria-hidden="true"><path d="m20 2 15.6 9v18L20 38 4.4 29V11L20 2Z" stroke="currentColor" strokeWidth="2.8"/><path d="m20 11 7.8 4.5v9L20 29l-7.8-4.5v-9L20 11Z" fill="currentColor"/><path d="M20 2v9m15.6 0-7.8 4.5m7.8 13.5-7.8-4.5M20 38v-9M4.4 29l7.8-4.5M4.4 11l7.8 4.5" stroke="currentColor" strokeWidth="2"/></svg>;
}
export function Button({ children, href, variant = 'primary', className = '', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { href?: string; variant?: 'primary' | 'secondary' | 'dark'; children: React.ReactNode }) {
  const anchor = useMagnetic<HTMLAnchorElement>();
  const button = useMagnetic<HTMLButtonElement>();
  const classes = 'button button-' + variant + ' ' + className;
  return href ? <Link ref={anchor} href={href} className={classes}>{children}<ArrowUpRight size={18} strokeWidth={1.8}/></Link> : <button ref={button} className={classes} {...props}>{children}<ArrowUpRight size={18} strokeWidth={1.8}/></button>;
}
export function SectionLabel({ children, number }: { children: React.ReactNode; number?: string }) { return <div className="section-label"><span className="label-dot"/>{children}{number && <span className="section-number">{number}</span>}</div>; }
export function Tick({ yes = true }: { yes?: boolean }) { return <span className={yes ? 'tick yes' : 'tick no'} aria-label={yes ? 'Included' : 'Not included'}>{yes ? <Check size={17}/> : <X size={16}/>}</span>; }
export function Toasts() {
  const { toasts, dismiss } = useUI();
  return <div className="toast-stack" aria-live="polite" aria-atomic="false"><AnimatePresence>{toasts.map((t) => <motion.div key={t.id} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ opacity: 0 }} role={t.kind === 'error' ? 'alert' : 'status'} className={'toast ' + t.kind}><span>{t.message}</span><button aria-label="Dismiss notification" onClick={() => dismiss(t.id)}><X size={17}/></button></motion.div>)}</AnimatePresence></div>;
}
export function FieldError({ message, id }: { message?: string; id?: string }) { return message ? <span id={id} className="field-error" role="alert">{message}</span> : null; }
