'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { readTheme, THEME_STORAGE_KEY, type Theme } from '@/lib/theme';

type ThemeContextValue = { theme: Theme; toggleTheme: () => void };
const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Matching server/client snapshots prevent hydration mismatches. The head
  // initializer has already applied the persisted appearance before this runs.
  const [theme, setTheme] = useState<Theme>('dark');

  const applyTheme = useCallback((next: Theme, persist = false) => {
    const root = document.documentElement;
    root.dataset.theme = next;
    root.style.colorScheme = next;
    setTheme(next);
    const background = getComputedStyle(root).getPropertyValue('--page-bg').trim();
    if (background) document.querySelector('meta[name="theme-color"]')?.setAttribute('content', background);
    if (persist) {
      try { window.localStorage.setItem(THEME_STORAGE_KEY, next); }
      catch { /* The current page still switches when browser storage is disabled. */ }
    }
  }, []);

  useEffect(() => {
    applyTheme(readTheme(document.documentElement.dataset.theme || null));
    const onStorage = (event: StorageEvent) => {
      if (event.key === THEME_STORAGE_KEY || event.key === null) applyTheme(readTheme(event.newValue));
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [applyTheme]);

  const toggleTheme = useCallback(() => {
    const current = readTheme(document.documentElement.dataset.theme || null);
    applyTheme(current === 'dark' ? 'light' : 'dark', true);
  }, [applyTheme]);

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
}

export function ThemeToggle() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('ThemeToggle must be inside ThemeProvider.');
  const { theme, toggleTheme } = context;
  const label = theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
  return (
    <button type="button" className="theme-toggle" onClick={toggleTheme} aria-label={label} title={label}>
      <Sun className="theme-icon theme-icon-sun" size={17} strokeWidth={1.6} aria-hidden="true"/>
      <Moon className="theme-icon theme-icon-moon" size={17} strokeWidth={1.6} aria-hidden="true"/>
    </button>
  );
}
