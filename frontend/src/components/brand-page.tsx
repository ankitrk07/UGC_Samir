'use client';
import { usePublicData } from './public-data';
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUpRight, AudioLines, Check, ChevronRight, Circle, Globe2, Heart, Layers3, MessageCircle, MoveUpRight, Play, Plus, Quote, Radio, Send, ShieldCheck, Sparkles, TrendingUp, Users, Zap } from 'lucide-react';
import { assets, creatorMedia, creatorVideos, logos } from '@/config/assets';
import { Hero } from './hero';
import { Button, HiveMark, SectionLabel, Tick } from './ui';
import { VideoCard } from './video-card';
import { PricingCards } from './pricing';
const AnalyticsPreview = dynamic(() => import('./analytics-preview'), { ssr: false, loading: () => <div className="chart-loading">PREPARING YOUR NUMBERS<span/></div> });
gsap.registerPlugin(ScrollTrigger);
function Count({ value, suffix = '' }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const counter = { v: 0 };
    const tween = gsap.to(counter, { v: value, duration: 1.7, ease: 'power2.out', paused: true, onUpdate: () => { el.textContent = Math.round(counter.v).toLocaleString() + suffix; } });
    const observer = new IntersectionObserver(([e]) => { if (e.isIntersecting) { tween.play(); observer.disconnect(); } }, { threshold: 0.4 });
    observer.observe(el); return () => { tween.kill(); observer.disconnect(); };
  }, [value, suffix]);
  return <span ref={ref}>{value.toLocaleString()}{suffix}</span>;
}
function TrustedBy() {
 const managed=usePublicData().media;const displayLogos=logos.map(l=>managed.find(a=>a.id===l.id)??l);
  return <section className="trusted-section"><div className="trusted-caption"><span className="eyebrow">GOOD COMPANY.<br/><b>BETTER CONVERSATIONS.</b></span><span>Built for brands with something to say.<br/><small>Illustrative brand partners below.</small></span></div><div className="logo-marquee" aria-label="Eight illustrative partner brand logos"><div className="logo-track">{[...displayLogos, ...displayLogos].map((l, i) => <div className="logo-item" key={i} aria-hidden={i >= logos.length ? true : undefined}><Image src={l.url} width={150} height={40} alt={i >= logos.length ? '' : l.alt}/><span>↗</span></div>)}</div></div></section>;
}
const statements = [
 { label: '01 / PEOPLE, NOT PLACEMENTS', title: <>Not an agency.<br/>An organic <em>machine.</em></>, text: 'People scroll past ads. They stop for people. Put your brand in the hands of creators who actually get it.' },
 { label: '02 / A NETWORK, NOT A ROSTER', title: <>One brief.<br/>A thousand <em>perspectives.</em></>, text: 'Find your corner of the internet. From skincare obsessives to trail runners, real voices make your story their own.' },
 { label: '03 / MOMENTUM, NOT MOMENTS', title: <>The campaign ends.<br/>The conversation <em>doesn’t.</em></>, text: 'Every post is another way in. Build a growing library of human stories that keep working long after launch day.' },
];
function MachineStory() {
  const ref = useRef<HTMLElement>(null);
  const video = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(0);
  useEffect(() => {
    const mm = gsap.matchMedia();
    mm.add('(min-width: 900px) and (prefers-reduced-motion: no-preference)', () => {
      if (!ref.current) return;
      const timeline = gsap.timeline({ scrollTrigger: { trigger: ref.current, pin: true, start: 'top top', end: '+=150%', scrub: 1, onUpdate: (self) => setStep(Math.min(2, Math.floor(self.progress * 3))) } });
      timeline.fromTo(video.current, { rotateY: -12, rotateZ: 7 }, { rotateY: 18, rotateZ: -6, scale: 1.06 });
    });
    return () => mm.revert();
  }, []);
  return <section id="machine" className="machine-section section-pad" ref={ref}><div className="machine-left"><SectionLabel number="01">WORD OF MOUTH. AT INTERNET SPEED.</SectionLabel><div className="story-content"><AnimatePresence mode="wait"><motion.div key={step} initial={{ y: 15, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -15, opacity: 0 }} transition={{ duration: 0.25 }}><span className="eyebrow story-kicker">{statements[step].label}</span><h2>{statements[step].title}</h2><p>{statements[step].text}</p></motion.div></AnimatePresence></div><div className="story-steps" role="group" aria-label="Explore how TrendHive works">{statements.map((s, i) => <button key={s.label} className={step === i ? 'active' : ''} aria-label={'Statement ' + (i + 1)} aria-pressed={step === i} onClick={() => setStep(i)}><span>0{i + 1}</span><i/></button>)}<span className="eyebrow">THE HUMAN ADVANTAGE</span></div></div><div className="machine-right"><div className="story-orbit" aria-hidden="true"/><div ref={video} className="story-video"><VideoCard image={assets.creator4} video={assets.video3} title="Less polished. More personal." handle="@goodthings.daily" views="384.2K"/><div className="story-notification"><span><Heart size={17} fill="currentColor"/></span><div><strong>“Okay, I actually need this.”</strong><small>The comment that changes everything.</small></div></div></div><span className="story-side-label eyebrow">THE KIND OF CONTENT YOU DON’T SKIP.</span><span className="story-doodle" aria-hidden="true">↙</span></div></section>;
}
function ValueBlocks() {
  const ref = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const mm = gsap.matchMedia();
    mm.add('(min-width: 1000px) and (prefers-reduced-motion: no-preference)', () => {
      const el = track.current; if (!el) return;
      gsap.to(el, { x: () => -Math.max(0, el.scrollWidth - (ref.current?.clientWidth || 0) + 100), ease: 'none', scrollTrigger: { trigger: ref.current, start: 'top 6%', pin: true, scrub: 0.8, end: () => '+=' + Math.max(500, el.scrollWidth - window.innerWidth), invalidateOnRefresh: true } });
    });
    return () => mm.revert();
  }, []);
  return <section className="values-section" ref={ref}><div className="values-heading"><SectionLabel number="02">SMALL POSTS. BIG RIPPLE EFFECT.</SectionLabel><div><h2>More human.<br/><em>More impact.</em></h2><span className="eyebrow">THREE REASONS TO<br/>RETHINK YOUR REACH <ArrowRight size={22}/></span></div></div><div className="value-track" ref={track}><article className="value-card value-organic"><div className="value-top"><span>01 / THE CONNECTION</span><Heart size={19}/></div><div className="value-visual organic-visual"><div className="message-bubble">not an ad. a good find.<span>Seen by your kind of people.</span></div><div className="message-reply">where did you get this? <ArrowUpRight size={18}/></div><span className="floating-heart"><Heart fill="currentColor"/></span></div><div><span className="value-stat"><Count value={8} suffix=".4%"/><small>DEMO ENGAGEMENT RATE</small></span><h3>Feels organic.<br/>Because it is.</h3><p>Real people. Their own words. Content that belongs in a feed, not an ad break.</p></div></article><article className="value-card value-compound"><div className="value-top"><span>02 / THE COMPOUND EFFECT</span><TrendingUp size={19}/></div><div className="value-visual compound-visual"><div className="compound-bars">{[18, 28, 35, 31, 49, 56, 67, 83, 100].map((h, i) => <div key={i} style={{ height: h + '%', animationDelay: i * 0.12 + 's' }}/>)}</div><span className="compound-tag">THE RIPPLE IS REAL ↗</span></div><div><span className="value-stat"><Count value={300} suffix="M+"/><small>VIEWS ACROSS THE NETWORK</small></span><h3>Compounds<br/>over time.</h3><p>One post starts a conversation. A whole network keeps it going. That’s momentum you can measure.</p></div></article><article className="value-card value-machine"><div className="value-top"><span>03 / THE HEAVY LIFTING</span><Zap size={19}/></div><div className="value-visual machine-visual"><div><span><Check size={14}/></span> Creators matched <b>84</b></div><div><span><Check size={14}/></span> Content in review <b>32</b></div><div><span className="lime-dot"/></div><div className="machine-ready"><HiveMark/>YOUR CAMPAIGN IS LIVE <ArrowUpRight size={16}/></div></div><div><span className="value-stat"><Count value={1}/><small>PLATFORM. THE WHOLE WORKFLOW.</small></span><h3>You don’t build<br/>the machine.</h3><p>The brief. The creators. The approvals. The numbers. All in one place. Go get your afternoon back.</p></div></article></div><div className="values-bottom eyebrow"><span>MADE FOR THE WAY PEOPLE ACTUALLY DISCOVER THINGS.</span><span>DRAG / SCROLL TO EXPLORE ↔</span></div></section>;
}
const creatorCopy = [
 ['The everyday edit.', '@the.everyday.edit', '128.4K'], ['A little unfiltered.', '@a.little.unfiltered', '246.8K'], ['Worth the detour.', '@thecitynotebook', '92.1K'], ['Small rituals. Big mood.', '@slowmorning.studio', '384.2K'], ['Found my new thing.', '@goodthings.daily', '185.6K'], ['Made you look.', '@not.just.another.post', '312.8K'],
];
function CreatorWall() {
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef({ x: 0, scroll: 0, active: false });
  useEffect(() => {
    const el = ref.current; if (!el) return;
    el.scrollLeft = el.scrollWidth / 3;
    const reset = () => { const third = el.scrollWidth / 3; if (el.scrollLeft < third * 0.2) el.scrollLeft += third; else if (el.scrollLeft > third * 1.8) el.scrollLeft -= third; };
    el.addEventListener('scroll', reset, { passive: true });
    return () => el.removeEventListener('scroll', reset);
  }, []);
  return <section className="creator-section section-pad"><div className="section-heading" data-reveal><SectionLabel number="03">THE INTERNET HAS PEOPLE FOR THAT</SectionLabel><div className="heading-row"><h2>Not influencers.<br/><em>People of influence.</em></h2><div className="section-aside"><p>Different corners of the internet.<br/>One very loud collective.</p><Link href="/for-creators" className="text-link">Meet your next collaborators <ArrowUpRight size={16}/></Link></div></div></div><div className="creator-carousel" ref={ref} tabIndex={0} role="region" aria-label="Creator sample video gallery. Scroll or drag to explore." data-cursor="drag" onPointerDown={(e) => { if (e.pointerType !== 'mouse' || (e.target as HTMLElement).closest('button')) return; drag.current = { active: true, x: e.clientX, scroll: e.currentTarget.scrollLeft }; e.currentTarget.setPointerCapture(e.pointerId); }} onPointerMove={(e) => { if (drag.current.active) e.currentTarget.scrollLeft = drag.current.scroll - (e.clientX - drag.current.x); }} onPointerUp={() => { drag.current.active = false; }} onPointerCancel={() => { drag.current.active = false; }} onKeyDown={(e) => { if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); e.currentTarget.scrollBy({ left: e.key === 'ArrowRight' ? 300 : -300, behavior: 'smooth' }); } }}>{[0, 1, 2].map((repeat) => <div className="creator-group" key={repeat} aria-hidden={repeat !== 1 ? true : undefined}>{creatorMedia.map((img, i) => <div className={'wall-card wall-card-' + i} key={img.id}><VideoCard controlTabIndex={repeat===1?0:-1} image={img} video={creatorVideos[i % 3]} title={creatorCopy[i][0]} handle={creatorCopy[i][1]} views={creatorCopy[i][2]}/></div>)}</div>)}</div><div className="wall-caption"><span className="eyebrow"><span className="live-dot"/>REAL VOICES. ZERO SCRIPTS.</span><span>Sample media & illustrative creator profiles.</span><span className="drag-hint"><ArrowLeft size={15}/> DRAG TO FIND YOUR PEOPLE <ArrowRight size={15}/></span></div></section>;
}
function Comparison() {
 const rows = [
 ['What you’re paying for', 'A creator network', 'Individual posts', 'Rented attention'],
 ['Content that feels human', true, true, false],
 ['Keeps working after the spend', true, false, false],
 ['Scales without a bigger ad budget', true, false, false],
 ['Content library included', true, false, false],
 ['Creator discovery + analytics', true, false, true],
 ['Your audience can hit “skip ad”', false, false, true],
 ];
 return <section className="comparison-section section-pad"><div className="section-heading" data-reveal><SectionLabel number="04">LET’S PUT IT SIDE BY SIDE</SectionLabel><div className="heading-row"><h2>Same budget.<br/><em>Different energy.</em></h2><p className="section-aside">There’s buying attention.<br/>And then there’s earning it.</p></div></div><div className="comparison-scroll" tabIndex={0} role="region" aria-label="Marketing channel comparison"><table className="comparison-table"><thead><tr><th scope="col"><span className="eyebrow">THE THINGS THAT MATTER</span></th><th scope="col" className="hive-col"><HiveMark/><span>TRENDHIVE</span><small>THE ORGANIC WAY</small></th><th scope="col">Influencer<br/>marketing</th><th scope="col">Meta<br/>ads</th></tr></thead><tbody>{rows.map(([title,...values],i)=><tr key={String(title)} data-reveal><th scope="row"><span className="row-number">0{i+1}</span>{title}</th>{values.map((v,j)=><td key={j} className={j===0?'hive-col':''}>{typeof v==='boolean'?<Tick yes={v}/>:<span className="comparison-word">{v}</span>}</td>)}</tr>)}</tbody></table></div><p className="comparison-note">An illustrative comparison of typical workflows. Features, rights and outcomes vary by provider and campaign.</p></section>;
}
const testimonials = [
 { quote: 'We stopped asking “how do we make an ad?” and started asking “who would actually love this?” Everything changed.', type: 'DTC SKINCARE BRAND', tag: 'THE BEAUTY EDIT', metric: '2.8M', label: 'ILLUSTRATIVE CAMPAIGN VIEWS', initials: 'BE', color: '#FF2E93' },
 { quote: 'Our best-performing content came from someone filming in their kitchen. Turns out, real life is a pretty good creative director.', type: 'FOOD & DRINK BRAND', tag: 'THE EVERYDAY BRAND', metric: '8.4%', label: 'ILLUSTRATIVE ENGAGEMENT', initials: 'EB', color: '#C6FF00' },
 { quote: 'One brief. A whole library of stories we never would have thought to tell ourselves. That’s the part we keep coming back for.', type: 'INDEPENDENT LIFESTYLE BRAND', tag: 'THE SLOW LIVING CLUB', metric: '84', label: 'ILLUSTRATIVE CREATOR PARTNERS', initials: 'SL', color: '#6B4DFF' },
];
function Testimonials() {
 const managed=usePublicData().testimonials;const stories=managed.length?managed:testimonials;
 const [index,setIndex]=useState(0);
 const [paused,setPaused]=useState(false);
 const reduce=useReducedMotion();
 const [dragReady,setDragReady]=useState(false);
 useEffect(()=>setDragReady(!reduce),[reduce]);
 useEffect(()=>{if(paused||reduce)return;const t=setInterval(()=>setIndex((i)=>(i+1)%stories.length),6500);return()=>clearInterval(t);},[paused,reduce,stories.length]);
 const t=stories[index%stories.length];
 return <section className="testimonial-section section-pad" onMouseEnter={()=>setPaused(true)} onMouseLeave={()=>setPaused(false)} onFocusCapture={()=>setPaused(true)} onBlurCapture={(e)=>{if(!e.currentTarget.contains(e.relatedTarget))setPaused(false);}}><div className="testimonial-intro" data-reveal><SectionLabel>LESS PITCH. MORE PROOF.</SectionLabel><h2>Good things<br/><em>get people talking.</em></h2><p>What a creator-first approach can feel like.</p><span className="demo-disclaimer">ILLUSTRATIVE STORIES — NOT CUSTOMER ENDORSEMENTS</span><div className="deck-controls"><button aria-label="Previous story" onClick={()=>setIndex((index+stories.length-1)%stories.length)}><ArrowLeft size={18}/></button><span>0{index+1} / 03</span><button aria-label="Next story" onClick={()=>setIndex((index+1)%stories.length)}><ArrowRight size={18}/></button><button aria-label={paused?'Play stories':'Pause stories'} onClick={()=>setPaused(!paused)}>{paused?<Play size={15}/>:<span aria-hidden="true">Ⅱ</span>}</button></div></div><div className="testimonial-deck"><div className="deck-under deck-under-one"/><div className="deck-under deck-under-two"/><AnimatePresence mode="wait"><motion.article key={index} className="testimonial-card" initial={{opacity:0,rotate:3,x:25}} animate={{opacity:1,rotate:-1,x:0}} exit={{opacity:0,x:-70,rotate:-5}} transition={{duration:reduce?0:0.35}} drag={dragReady?'x':false} dragConstraints={{left:0,right:0}} dragElastic={0.3} onDragEnd={(_, info)=>{if(Math.abs(info.offset.x)>60)setIndex((index+(info.offset.x<0?1:stories.length-1))%stories.length);}} aria-live="polite"><div className="testimonial-top"><span className="testimonial-type">{t.type}</span><Quote size={28}/></div><blockquote>“{t.quote}”</blockquote><div className="testimonial-person"><span className="testimonial-avatar" data-tone={t.initials} style={{background:t.color}}>{t.initials}</span><span>{t.tag}<small>Campaign perspective · demo</small></span><ArrowUpRight size={23}/></div><div className="testimonial-result"><strong>{t.metric}</strong><span>{t.label}</span></div></motion.article></AnimatePresence></div></section>;
}
function DashboardSection() {
 const ref=useRef<HTMLElement>(null);const [show,setShow]=useState(false);
 useEffect(()=>{const observer=new IntersectionObserver(([e])=>{if(e.isIntersecting){setShow(true);observer.disconnect();}},{rootMargin:'300px'});if(ref.current)observer.observe(ref.current);return()=>observer.disconnect();},[]);
 return <section className="dashboard-section section-pad" ref={ref}><div className="section-heading" data-reveal><SectionLabel number="06">NO SPREADSHEET ACROBATICS</SectionLabel><div className="heading-row"><h2>Your hive.<br/><em>From a bird’s-eye view.</em></h2><div className="section-aside"><p>From first brief to final numbers.<br/>One place to see the whole picture.</p><Link className="text-link" href="/dashboard-demo">Take it for a spin <ArrowUpRight size={16}/></Link></div></div></div><div className="dashboard-preview" data-reveal><aside className="mini-sidebar"><div className="mini-hive"><HiveMark/></div>{[Layers3,Users,TrendingUp,MessageCircle].map((Icon,i)=><span key={i} className={i===0?'selected':''}><Icon size={19}/></span>)}<span className="sidebar-avatar">JD</span></aside><div className="dashboard-preview-content"><div className="preview-breadcrumb"><span>Workspace <ChevronRight size={12}/> Overview</span><span><i className="live-dot"/> YOUR HIVE IS LIVE</span></div><div className="preview-title"><div><span className="eyebrow">MONDAY LOOKS GOOD ON YOU.</span><h3>Good morning, Jordan <span className="lime">↗</span></h3></div><Link href="/dashboard-demo" className="mini-new-campaign"><Plus size={14}/> New campaign</Link></div><div className="preview-stats">{[['Total views','4.83M','+32.8%'],['Active creators','280','+18.2%'],['Avg. engagement','8.4%','+2.1%'],['Earned media value','$34.8K','+42.6%']].map(([l,v,d])=><div key={l}><span>{l}</span><strong>{v}</strong><small><TrendingUp size={11}/>{d}</small></div>)}</div>{show?<AnalyticsPreview/>:<div className="chart-loading">YOUR NUMBERS ARE ON THEIR WAY.</div>}</div><span className="preview-sticker">ALL SIGNAL.<br/>NO NOISE.</span></div></section>;
}
function pointInPolygon(x:number,y:number,poly:number[][]) {let inside=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const [xi,yi]=poly[i], [xj,yj]=poly[j];if(((yi>y)!==(yj>y))&&(x<(xj-xi)*(y-yi)/(yj-yi)+xi))inside=!inside;}return inside;}
const continents=[[[50,80],[120,40],[210,50],[250,100],[190,145],[165,200],[110,150],[70,140]],[[185,195],[255,210],[265,255],[235,320],[215,350],[195,285]],[[350,85],[430,55],[490,70],[570,45],[660,65],[735,115],[690,165],[610,175],[570,215],[520,160],[450,125],[390,130]],[[375,140],[450,145],[480,210],[445,285],[415,290],[385,220],[360,175]],[[625,260],[680,240],[730,270],[715,310],[650,305]],[[250,35],[300,25],[310,65],[275,85]],[[590,210],[620,200],[645,235],[610,230]]];
function GlobalReach() {
 const dots=[];for(let x=30;x<770;x+=9)for(let y=20;y<360;y+=9)if(continents.some(p=>pointInPolygon(x,y,p)))dots.push([x,y]);
 const markers=[{x:125,y:120,name:'United States'},{x:205,y:235,name:'Brazil'},{x:395,y:100,name:'United Kingdom'},{x:430,y:110,name:'Germany'},{x:540,y:170,name:'India'},{x:680,y:120,name:'Japan'},{x:680,y:282,name:'Australia'},{x:440,y:260,name:'South Africa'}];
 return <section className="global-section section-pad"><div className="global-copy" data-reveal><SectionLabel number="08">LOCAL VOICES. GLOBAL VOLUME.</SectionLabel><h2>Small world.<br/><em>Massive hive.</em></h2><p>Your next customer might be across the street.<br/>Or eight time zones away. We know people.</p><div className="global-stat"><Count value={60} suffix="+"/><span>COUNTRIES.<br/>COUNTLESS CONVERSATIONS.</span></div></div><div className="world-map"><svg viewBox="0 0 800 380" role="img" aria-labelledby="map-title"><title id="map-title">Creator network spanning over sixty countries</title>{dots.map(([x,y])=><circle key={x+'-'+y} cx={x} cy={y} r="1.6" fill="var(--map-dot)"/>)}{markers.map((m,i)=><g key={m.name} className="map-marker" tabIndex={0} aria-label={m.name}><circle className="map-pulse" cx={m.x} cy={m.y} r="12" style={{animationDelay:i*.4+'s'}}/><circle cx={m.x} cy={m.y} r="4" fill="var(--map-marker)"/><g className="map-tooltip"><rect x={m.x-55} y={m.y-34} width="110" height="24" rx="6" fill="#C6FF00"/><text x={m.x} y={m.y-18} textAnchor="middle" fill="#07070A" fontSize="10">{m.name}</text></g></g>)}</svg><span className="eyebrow map-caption"><i className="live-dot"/>MANY LANGUAGES. ONE HUMAN CONNECTION.</span></div><div className="country-marquee"><div>{[0,1].map(n=><span key={n} aria-hidden={n===1?true:undefined}>{['UNITED STATES','UNITED KINGDOM','INDIA','AUSTRALIA','GERMANY','BRAZIL','JAPAN','SOUTH AFRICA'].map((c,i)=><span key={c}><i className={'flag flag-'+i}/>{c}<b>✳</b></span>)}</span>)}</div></div></section>;
}
function ParticleField() {
 const ref=useRef<HTMLCanvasElement>(null);
 useEffect(()=>{
  const canvas=ref.current;if(!canvas||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;const ctx=canvas.getContext('2d');if(!ctx)return;
  let particleRgb=getComputedStyle(canvas).getPropertyValue('--particle-rgb').trim();
  const themeObserver=new MutationObserver(()=>{particleRgb=getComputedStyle(canvas).getPropertyValue('--particle-rgb').trim();});
  themeObserver.observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
  let frame=0;let visible=false;let width=0;let height=0;const pointer={x:-1000,y:-1000};let particles:{x:number;y:number;r:number;phase:number}[]=[];
  const resize=()=>{width=canvas.clientWidth;height=canvas.clientHeight;const dpr=Math.min(window.devicePixelRatio,1.5);canvas.width=width*dpr;canvas.height=height*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);particles=Array.from({length:70},()=>({x:Math.random()*width,y:Math.random()*height,r:Math.random()*1.4+.3,phase:Math.random()*6}));};
  const move=(e:PointerEvent)=>{const r=canvas.getBoundingClientRect();pointer.x=e.clientX-r.left;pointer.y=e.clientY-r.top;};
  const draw=(time:number)=>{if(!visible)return;ctx.clearRect(0,0,width,height);particles.forEach(p=>{const x=p.x+Math.sin(time*.0002+p.phase)*16,y=p.y+Math.cos(time*.00025+p.phase)*18;const dx=x-pointer.x,dy=y-pointer.y;const dist=Math.sqrt(dx*dx+dy*dy)||1;const force=Math.max(0,1-dist/160)*36;ctx.fillStyle='rgba('+particleRgb+','+(0.2+Math.max(0,1-dist/200)*.6)+')';ctx.beginPath();ctx.arc(x+dx/dist*force,y+dy/dist*force,p.r,0,Math.PI*2);ctx.fill();});frame=requestAnimationFrame(draw);};
  const observer=new IntersectionObserver(([e])=>{visible=e.isIntersecting;cancelAnimationFrame(frame);if(visible)frame=requestAnimationFrame(draw);});observer.observe(canvas);
  resize();window.addEventListener('resize',resize);canvas.parentElement?.addEventListener('pointermove',move);
  return()=>{observer.disconnect();themeObserver.disconnect();cancelAnimationFrame(frame);window.removeEventListener('resize',resize);canvas.parentElement?.removeEventListener('pointermove',move);};
 },[]);
 return <canvas className="particle-field" ref={ref} aria-hidden="true"/>;
}
export function FinalCTA() {
 return <section className="final-cta"><ParticleField/><div className="cta-orbit" aria-hidden="true"/><span className="eyebrow"><span className="live-dot"/>YOUR NEXT BIG THING STARTS WITH PEOPLE.</span><h2>Let’s make<br/><em>some noise.</em><span className="cta-asterisk" aria-hidden="true">✳</span></h2><p>The creators are out there. Your audience is listening.<br/>Give them something worth talking about.</p><Button href="/signup" className="huge-button">Get your brand buzzing</Button><span className="trial-note">7-DAY FREE TRIAL · NO CREDIT CARD · NO AD SPEND</span><Link href="/book-call" className="cta-chat">Rather talk to a human? <ArrowUpRight size={14}/></Link></section>;
}
export function BrandPage() {
 return <main id="main"><Hero/><TrustedBy/><MachineStory/><ValueBlocks/><CreatorWall/><div className="statement-tape" aria-hidden="true"><div>{[0,1,2,3].map(i=><span key={i}>STOP BUYING ATTENTION. <i>START EARNING IT.</i> ✳ </span>)}</div></div><Comparison/><Testimonials/><DashboardSection/><PricingCards/><GlobalReach/><FinalCTA/></main>;
}
