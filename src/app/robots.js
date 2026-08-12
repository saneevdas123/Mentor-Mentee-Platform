import { getSiteUrl } from '@/lib/site';

export default function robots() {
  const base = getSiteUrl();
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/login'],
      disallow: [
        '/admin',
        '/dean',
        '/hod',
        '/mentor',
        '/student',
        '/api/',
      ],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
