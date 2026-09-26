import type { MetadataRoute } from 'next';
import { SITE_BASE_URL, SITE_DOMAIN } from '@/lib/seo/constants';

/**
 * app/robots.ts — Authoritative robots.txt
 * Allows all crawlers, points to sitemap, blocks junk paths.
 */

export const dynamic = 'force-static';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/_next/',
          '/api/',
          '/*.json$',
        ],
      },
    ],
    sitemap: `${SITE_BASE_URL}/sitemap.xml`,
    host:    SITE_BASE_URL,
  };
}
