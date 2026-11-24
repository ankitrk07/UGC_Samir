'use client';
import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
export function useSplitText<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    if (!ref.current || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      gsap.fromTo('[data-word]', { yPercent: 115, rotate: 3 }, { yPercent: 0, rotate: 0, stagger: 0.09, duration: 0.95, ease: 'power4.out', delay: sessionStorage.getItem('hive-loaded') ? 0.1 : 1.4 });
    }, ref);
    return () => ctx.revert();
  }, []);
  return ref;
}
