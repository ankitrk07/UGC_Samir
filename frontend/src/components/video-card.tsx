'use client';
import { usePublicData } from './public-data';
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Play, Pause, ArrowUpRight, VolumeX } from 'lucide-react';
import type { Asset } from '@/config/assets';
export function VideoCard({ image, video, title, handle, views, className = '', priority = false, controlTabIndex = 0 }: { image: Asset; video: Asset; title: string; handle: string; views: string; className?: string; priority?: boolean; controlTabIndex?: number }) {
  const managed=usePublicData().media;
  image=managed.find(a=>a.id===image.id)??image;
  video=managed.find(a=>a.id===video.id)??video;
  const ref = useRef<HTMLDivElement>(null);
  const player = useRef<HTMLVideoElement>(null);
  const [active, setActive] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [near, setNear] = useState(false);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => { setNear(entry.isIntersecting); if (!entry.isIntersecting) { setActive(false); player.current?.pause(); } }, { rootMargin: '160px' });
    const actual = new IntersectionObserver(([entry]) => { setInView(entry.isIntersecting); if (!entry.isIntersecting) { setActive(false); player.current?.pause(); } });
    if (ref.current) { observer.observe(ref.current); actual.observe(ref.current); }
    return () => { observer.disconnect(); actual.disconnect(); };
  }, []);
  useEffect(() => {
    if (!player.current) return;
    if (active && near && inView && loaded) player.current.play().catch(() => setActive(false));
    else player.current.pause();
  }, [active, near, inView, loaded]);
  const preview = () => { if (window.matchMedia('(prefers-reduced-motion: no-preference) and (pointer: fine)').matches) { setLoaded(true); setActive(true); } };
  return <div ref={ref} className={'video-card ' + className} onMouseEnter={preview} onMouseLeave={() => { setActive(false); if (ref.current) { ref.current.style.setProperty('--rx', '0deg'); ref.current.style.setProperty('--ry', '0deg'); } }} onMouseMove={(e) => { if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return; const r = e.currentTarget.getBoundingClientRect(); e.currentTarget.style.setProperty('--rx', (-(e.clientY - r.top - r.height / 2) / 35) + 'deg'); e.currentTarget.style.setProperty('--ry', ((e.clientX - r.left - r.width / 2) / 28) + 'deg'); }}><Image src={image.url} alt={image.alt} fill sizes={priority ? '(max-width: 640px) 32vw, 220px' : '(max-width: 640px) 75vw, 300px'} priority={priority} className="creator-photo"/><video ref={player} src={near && loaded ? video.url : undefined} poster={image.url} muted loop playsInline preload="none" aria-label={video.alt} className={active ? 'video-active' : ''} onCanPlay={() => { if (active) player.current?.play().catch(() => setActive(false)); }} onError={() => setActive(false)}/><div className="video-scrim"/><div className="video-top"><span className="video-tag">THE CREATOR EDIT</span><VolumeX size={13} aria-hidden="true"/></div><button tabIndex={controlTabIndex} className="play-button" aria-label={(active ? 'Pause' : 'Play') + ' sample video: ' + title} onClick={() => { setLoaded(true); setActive(!active); }}>{active ? <Pause size={17} fill="currentColor"/> : <Play size={17} fill="currentColor"/>}</button><div className="video-info"><span>{handle}</span><strong>{title}</strong><div><span className="view-count"><Play size={10} fill="currentColor"/>{views}</span><ArrowUpRight size={17}/></div></div></div>;
}
