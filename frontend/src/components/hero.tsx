'use client';
import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowUpRight } from 'lucide-react';
import { LiveStat } from './live-stat';
import { assets } from '@/config/assets';
import { Button } from './ui';
import { VideoCard } from './video-card';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useSplitText } from '@/hooks/useSplitText';
const HiveScene = dynamic(() => import('./hive-scene'), { ssr: false });
export function Hero() {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const mm = gsap.matchMedia();
    mm.add('(min-width: 900px) and (prefers-reduced-motion: no-preference)', () => {
      const ctx = gsap.context(() => {
        gsap.to('.hero-card-one', { y: -100, ease: 'none', scrollTrigger: { trigger: ref.current, start: 'top top', end: 'bottom top', scrub: 1 } });
        gsap.to('.hero-card-two', { y: 60, ease: 'none', scrollTrigger: { trigger: ref.current, start: 'top top', end: 'bottom top', scrub: 1 } });
      }, ref);
      return () => ctx.revert();
    });
    return () => mm.revert();
  }, []);
  const title = useSplitText<HTMLHeadingElement>();
  const ref = useRef<HTMLElement>(null);
  const [scene, setScene] = useState(false);
  useEffect(() => {
    if (!window.matchMedia('(min-width: 900px) and (prefers-reduced-motion: no-preference)').matches) return;
    const el = ref.current; if (!el) return;
    const observer = new IntersectionObserver(([e]) => setScene(e.isIntersecting));
    const timer = setTimeout(() => observer.observe(el), 1900);
    return () => { clearTimeout(timer); observer.disconnect(); };
  }, []);
  return <section className="hero" ref={ref}><div className="hero-grid" aria-hidden="true"/><div className="hero-glow" aria-hidden="true"/><div className="hero-coordinate eyebrow">INDEPENDENT VOICES.<br/>COLLECTIVE IMPACT.</div><div className="hero-live"><span className="live-dot"/><span>THE NEXT WAVE IS ORGANIC</span></div><div className="hero-orbit" aria-hidden="true">{scene && <HiveScene/>}</div><div className="orbit-label eyebrow">BUILT TO SPREAD ↗</div><div className="hero-card hero-card-one"><VideoCard image={assets.creator1} video={assets.video1} title="Real life. Real influence." handle="@the.everyday.edit" views="128.4K" priority/></div><div className="hero-card hero-card-two"><VideoCard image={assets.creator2} video={assets.video2} title="Your next obsession." handle="@a.little.unfiltered" views="246.8K" priority/><span className="card-sticker">100%<br/>HUMAN</span></div><div className="hero-center"><h1 ref={title}><span className="word-line"><span data-word><LiveStat field="creators" fallback="250K"/></span> <span data-word>creators.</span></span><span className="word-line"><span data-word>Zero</span> <span data-word>ad spend.</span></span><span className="word-line organic-line"><span data-word>Pure</span> <span data-word>organic.</span><span className="organic-star" aria-hidden="true">✳</span></span></h1><p className="hero-description">Turn real people into your most powerful marketing channel.<br className="hidden sm:block"/> More stories. More conversations. No “skip ad” button.</p><div className="hero-buttons"><Button href="/signup">Start your free trial</Button><Button href="/book-call" variant="secondary">Book a call</Button></div><span className="trial-note">7 DAYS FREE. NO CREDIT CARD. ALL THE BUZZ.</span></div><div className="hero-bottom"><a href="#machine" className="scroll-prompt"><span className="scroll-icon"><ArrowDown size={16}/></span><span>SCROLL TO MEET<br/>YOUR NEW GROWTH ENGINE</span></a><div className="hero-proof"><div className="tiny-bars" aria-hidden="true">{[12, 19, 14, 26, 21, 32, 27, 37, 45].map((h, i) => <i key={i} style={{ height: h }}/>)}</div><div><strong><LiveStat field="views" fallback="300M+"/></strong><span>VIEWS. AND COUNTING.</span></div><span className="proof-arrow"><ArrowUpRight/></span></div><span className="hero-byline">A NEW KIND OF WORD OF MOUTH.<br/><b>BY ONETRENDSETTER.</b></span></div></section>;
}
