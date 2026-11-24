import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import { SiteShell } from '@/components/shell';
import { assets } from '@/config/assets';
import { ThemeProvider } from '@/components/theme-provider';
import { themeInitializationScript } from '@/lib/theme';
import { PublicDataProvider } from '@/components/public-data';
import './globals.css';
import './themes.css';
const clash = localFont({ src: './fonts/clash-display.woff2', variable: '--font-clash', display: 'swap', weight: '200 700' });
const satoshi = localFont({ src: './fonts/satoshi.woff2', variable: '--font-satoshi', display: 'swap', weight: '300 900' });
const mono = localFont({ src: './fonts/jetbrains-mono.woff2', variable: '--font-mono', display: 'swap', weight: '400' });
export const metadata: Metadata = {
 metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
 title: { default: 'TRENDHIVE — Good people. Unreal reach.', template: '%s — TRENDHIVE' },
 description: '250K creators. Zero ad spend. Pure organic. Launch creator campaigns that give people something worth talking about. By onetrendsetter.',
 applicationName: 'TRENDHIVE', creator: 'onetrendsetter',
 openGraph: { type: 'website', siteName: 'TRENDHIVE', title: 'TRENDHIVE — Real people. Unreal reach.', description: '250K creators. Zero ad spend. Pure organic.', images: [{ url: assets.og.url, width: 1200, height: 630, alt: assets.og.alt }] },
 twitter: { card: 'summary_large_image', title: 'TRENDHIVE — Real people. Unreal reach.', images: [assets.og.url] },
};
export const viewport: Viewport = { themeColor: '#07070A', width: 'device-width', initialScale: 1 };
export default function RootLayout({ children }: { children: React.ReactNode }) {
 return <html lang="en" data-theme="dark" suppressHydrationWarning><head><script id="trendhive-theme" dangerouslySetInnerHTML={{ __html: themeInitializationScript }}/></head><body className={clash.variable + ' ' + satoshi.variable + ' ' + mono.variable}><ThemeProvider><PublicDataProvider><SiteShell>{children}</SiteShell></PublicDataProvider></ThemeProvider></body></html>;
}
