import { SITE } from '@/lib/site';

export default function manifest() {
  return {
    name: SITE.appName,
    short_name: SITE.shortName,
    description: SITE.description,
    start_url: '/',
    display: 'standalone',
    background_color: '#FDF8F0',
    theme_color: '#FF4B3E',
    icons: [
      {
        src: '/icon',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable',
      },
    ],
  };
}
