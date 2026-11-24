'use client';
import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
export function Modal({ title, children, close }: { title: string; children: React.ReactNode; close: () => void }) {
 const ref=useRef<HTMLDivElement>(null);const closeRef=useRef(close);closeRef.current=close;
 useEffect(()=>{const before=document.activeElement as HTMLElement;const overflow=document.body.style.overflow;document.body.style.overflow='hidden';ref.current?.querySelector<HTMLElement>('button,input')?.focus();
 const key=(e:KeyboardEvent)=>{if(e.key==='Escape')closeRef.current();if(e.key==='Tab'){const els=ref.current?.querySelectorAll<HTMLElement>('a,button:not(:disabled),input,select,textarea,[tabindex="0"]');if(!els?.length)return;const first=els[0],last=els[els.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}};
 document.addEventListener('keydown',key);return()=>{document.removeEventListener('keydown',key);document.body.style.overflow=overflow;before?.focus();};},[]);
 return <div className="modal-backdrop" onClick={e=>{if(e.target===e.currentTarget)close();}}><div className="modal" ref={ref} role="dialog" aria-modal="true" aria-labelledby="modal-title"><div className="modal-heading"><h2 id="modal-title">{title}</h2><button aria-label="Close dialog" onClick={close}><X size={20}/></button></div>{children}</div></div>;
}
