/** @type {import('next').NextConfig} */
const config = {
  poweredByHeader: false,
  images: { remotePatterns: [...(process.env.NEXT_PUBLIC_MEDIA_HOST?[{protocol:'https',hostname:process.env.NEXT_PUBLIC_MEDIA_HOST}]:[]),{ protocol: 'https', hostname: 'picsum.photos' }, { protocol: 'https', hostname: 'fastly.picsum.photos' }], formats: ['image/avif', 'image/webp'] },
  async headers() { return [{ source: '/:path*', headers: [{ key: 'X-Content-Type-Options', value: 'nosniff' }, { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' }, { key: 'X-Frame-Options', value: 'DENY' }] }]; }
};
export default config;
