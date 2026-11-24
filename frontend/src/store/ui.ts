'use client';
import { create } from 'zustand';
type Toast = { id: number; message: string; kind: 'success' | 'error' };
type UI = { menuOpen: boolean; setMenuOpen: (open: boolean) => void; toasts: Toast[]; toast: (message: string, kind?: Toast['kind']) => void; dismiss: (id: number) => void; annual: boolean; setAnnual: (value: boolean) => void };
let toastId = 0;
export const useUI = create<UI>((set) => ({
  menuOpen: false, setMenuOpen: (menuOpen) => set({ menuOpen }), annual: false, setAnnual: (annual) => set({ annual }), toasts: [],
  toast: (message, kind = 'success') => { const id = ++toastId; set((s) => ({ toasts: [...s.toasts.slice(-3), { id, message, kind }] })); setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 6000); },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));
