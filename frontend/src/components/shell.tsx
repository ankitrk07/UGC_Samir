'use client';
import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { AnimatePresence, motion, MotionConfig, useReducedMotion } from 'framer-motion';
import Link from 'next/link';
import { ArrowUpRight, Menu, X } from 'lucide-react';
import { useUI } from '@/store/ui';
import { Button, HiveMark, Toasts } from './ui';
import { Newsletter } from './forms';
import { ThemeToggle } from './theme-provider';
gsap.registerPlugin(ScrollTrigger);
const links = [{ href: '/for-brands', label: 'For brands' }, { href: '/for-creators', label: 'For creators' }, { href: '/pricing', label: 'Pricing' }, { href: '/dashboard-demo', label: 'The platform', badge: true }];
function Preloader() {
  const [visible, setVisible] = useState(true);
  const [count, setCount] = useState(0);
  const reduce = useReducedMotion();
  useEffect(() => {
    if (sessionStorage.getItem('hive-loaded') || window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setVisible(false); return; }
    const start = performance.now();
    let frame = 0;
    const tick = (time: number) => { const progress = Math.min((time - start) / 1400, 1); setCount(Math.round(progress * 100)); if (progress < 1) frame = requestAnimationFrame(tick); else { sessionStorage.setItem('hive-loaded', '1'); setVisible(false); } };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);
  return <AnimatePresence>{visible && <motion.div className="preloader" exit={{ clipPath: 'inset(0 0 100% 0)' }} transition={{ duration: reduce ? 0 : 0.75, ease: [0.76, 0, 0.24, 1] }} aria-hidden="true"><div className="loader-hive">{Array.from({ length: 7 }, (_, i) => <motion.span key={i} initial={{ x: (i - 3) * 70, y: i % 2 ? 80 : -80, rotate: 90, opacity: 0 }} animate={{ x: 0, y: 0, rotate: 0, opacity: 1 }} transition={{ delay: i * 0.09, duration: 0.6 }}><HiveMark/></motion.span>)}</div><span className="font-mono">BUILDING A LITTLE BUZZ</span><strong>{String(count).padStart(3, '0')}<small>%</small></strong><div className="loader-line" style={{ transform: 'scaleX(' + count / 100 + ')' }}/></motion.div>}</AnimatePresence>;
}
function Cursor() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!window.matchMedia('(pointer:fine) and (prefers-reduced-motion: no-preference)').matches || !ref.current) return;
    const el = ref.current;
    const x = gsap.quickTo(el, 'x', { duration: 0.18 });
    const y = gsap.quickTo(el, 'y', { duration: 0.18 });
    const move = (e: MouseEvent) => { x(e.clientX); y(e.clientY); el.style.opacity = '1'; };
    const over = (e: MouseEvent) => { el.classList.toggle('cursor-active', !!(e.target as HTMLElement).closest('a,button,input,[data-cursor]')); };
    const leave = () => { el.style.opacity = '0'; };
    window.addEventListener('mousemove', move); window.addEventListener('mouseover', over); document.addEventListener('mouseleave', leave);
    return () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseover', over); document.removeEventListener('mouseleave', leave); gsap.killTweensOf(el); };
  }, []);
  return <div ref={ref} className="custom-cursor" aria-hidden="true"><span/></div>;
}
export function Navbar() {
  const path = usePathname();
  const { menuOpen, setMenuOpen } = useUI();
  const [hidden, setHidden] = useState(false);
  const mobileMenu = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  useEffect(() => { setMenuOpen(false); }, [path, setMenuOpen]);
  useEffect(() => { let last = window.scrollY; const scroll = () => { setHidden(window.scrollY > last && window.scrollY > 180); last = window.scrollY; }; window.addEventListener('scroll', scroll, { passive: true }); return () => window.removeEventListener('scroll', scroll); }, []);
  useEffect(() => {
    if (!menuOpen) return;
    const before = document.body.style.overflow; document.body.style.overflow = 'hidden';
    mobileMenu.current?.querySelector<HTMLAnchorElement>('a')?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
      if (e.key === 'Tab') {
        const focusable = mobileMenu.current?.querySelectorAll<HTMLElement>('a, button');
        if (!focusable?.length) return;
        const first = focusable[0], last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', key);
    return () => { document.body.style.overflow = before; document.removeEventListener('keydown', key); trigger.current?.focus(); };
  }, [menuOpen, setMenuOpen]);
  return <><header className={'nav-wrap ' + (hidden && !menuOpen ? 'nav-hidden' : '')}><nav className="navbar" aria-label="Main navigation"><Link href="/for-brands" className="brand" aria-label="TRENDHIVE home"><HiveMark/><span>TRENDHIVE<span className="brand-period">.</span></span></Link><div className="desktop-links">{links.map((l) => <Link key={l.href} href={l.href} className={path === l.href ? 'active' : ''}>{l.label}{l.badge && <span className="nav-new">LIVE</span>}</Link>)}</div><div className="nav-actions"><ThemeToggle/><Link className="login-link" href="/login">Log in <ArrowUpRight size={13}/></Link><Link className="nav-cta" href="/signup">Get started <ArrowUpRight size={15}/></Link></div><button ref={trigger} className="menu-toggle" aria-label="Open menu" aria-expanded={menuOpen} aria-controls="mobile-menu" onClick={() => setMenuOpen(true)}><Menu/></button></nav></header><AnimatePresence>{menuOpen && <motion.div ref={mobileMenu} id="mobile-menu" className="mobile-menu" role="dialog" aria-modal="true" aria-label="Navigation" initial={{ y: '-100%' }} animate={{ y: 0 }} exit={{ y: '-100%' }} transition={{ duration: 0.45 }}><div className="mobile-theme-control"><ThemeToggle/></div><button className="menu-close" aria-label="Close menu" onClick={() => setMenuOpen(false)}><X/></button>{[...links, { href: '/login', label: 'Log in' }, { href: '/signup', label: 'Get started' }].map((l, i) => <motion.div key={l.href} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.06 }}><Link href={l.href}>{l.label}<ArrowUpRight/></Link></motion.div>)}<span className="eyebrow">GOOD PEOPLE. GREAT REACH.</span></motion.div>}</AnimatePresence></>;
}
function Footer() {
  return <footer className="footer"><div className="footer-top"><div><Link href="/for-brands" className="brand"><HiveMark/>TRENDHIVE.</Link><p>Good things spread.<br/>We just give them a head start.</p></div><div className="footer-links"><Link href="/for-brands">For brands</Link><Link href="/for-creators">For creators</Link><Link href="/pricing">Pricing</Link><Link href="/book-call">Let’s talk <ArrowUpRight size={14}/></Link></div><div className="footer-news"><span className="eyebrow">A LITTLE BUZZ IN YOUR INBOX</span><Newsletter/><p>No noise. Just things worth passing on.</p></div></div><div className="footer-wordmark" aria-hidden="true">TRENDHIVE<span>®</span></div><div className="footer-bottom"><span>© {new Date().getFullYear()} TrendHive. By <a href="https://onetrendsetter.com" target="_blank" rel="noreferrer">onetrendsetter ↗</a></span><div><a href="https://www.instagram.com/" target="_blank" rel="noreferrer" aria-label="Instagram (social profile pending)">Instagram ↗</a><a href="https://www.linkedin.com/" target="_blank" rel="noreferrer" aria-label="LinkedIn (social profile pending)">LinkedIn ↗</a><Link href="/legal/privacy">Privacy</Link><Link href="/legal/terms">Terms</Link></div><span className="status-online"><i/>ALL SYSTEMS BUZZING</span></div></footer>;
}
export function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const reduce = useReducedMotion();
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const lenis = new Lenis({ duration: 1.05, smoothWheel: true, anchors: true });
    lenis.on('scroll', ScrollTrigger.update);
    const ticker = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(ticker); gsap.ticker.lagSmoothing(0);
    return () => { lenis.destroy(); gsap.ticker.remove(ticker); };
  }, []);
  useEffect(() => {
    const ctx = gsap.context(() => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((el) => gsap.fromTo(el, { y: 45, opacity: 0 }, { y: 0, opacity: 1, duration: 0.85, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 92%', once: true } }));
    });
    const timer = setTimeout(() => ScrollTrigger.refresh(), 350);
    return () => { clearTimeout(timer); ctx.revert(); };
  }, [pathname]);
  const dashboard = pathname.startsWith('/dashboard');
  return <MotionConfig reducedMotion="user"><a className="skip-link" href="#main">Skip to content</a><div className="grain" aria-hidden="true"/><Preloader/><Cursor/>{!dashboard && <Navbar/>}<motion.div key={pathname} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: reduce ? 0 : 0.35 }}>{children}</motion.div>{!dashboard && <Footer/>}<Toasts/></MotionConfig>;
}
