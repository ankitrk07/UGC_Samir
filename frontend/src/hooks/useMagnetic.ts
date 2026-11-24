'use client';
import { useEffect, useRef } from 'react';
import gsap from 'gsap';
export function useMagnetic<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || !window.matchMedia('(pointer: fine) and (prefers-reduced-motion: no-preference)').matches) return;
    const move = (e: MouseEvent) => { const r = el.getBoundingClientRect(); gsap.to(el, { x: (e.clientX - r.left - r.width / 2) * 0.15, y: (e.clientY - r.top - r.height / 2) * 0.2, duration: 0.35 }); };
    const leave = () => { gsap.to(el, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.4)' }); };
    el.addEventListener('mousemove', move); el.addEventListener('mouseleave', leave);
    return () => { el.removeEventListener('mousemove', move); el.removeEventListener('mouseleave', leave); gsap.killTweensOf(el); };
  }, []);
  return ref;
}
