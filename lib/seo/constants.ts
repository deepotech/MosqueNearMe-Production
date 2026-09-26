/**
 * lib/seo/constants.ts
 * Single source of truth for all SEO configuration.
 * NEVER hardcode domain strings anywhere else in the codebase.
 */

// ─── Domain ───────────────────────────────────────────────────
export const SITE_DOMAIN   = 'mosquenearme.net';
export const SITE_BASE_URL = 'https://mosquenearme.net'; // NO trailing slash

// ─── Brand ────────────────────────────────────────────────────
export const SITE_NAME       = 'Mosque Near Me';
export const SITE_TAGLINE    = 'Find Mosques & Prayer Times Across the UK';
export const TWITTER_HANDLE  = '@mosquenearme';
export const DEFAULT_OG_IMG  = `${SITE_BASE_URL}/og-image.png`;

// ─── Default metadata ─────────────────────────────────────────
export const DEFAULT_TITLE       = `${SITE_NAME} - ${SITE_TAGLINE}`;
export const DEFAULT_DESCRIPTION = 'Find mosques, prayer times, and Islamic centres near you across the UK. Discover facilities, directions, and nearby mosques.';
export const DEFAULT_KEYWORDS    = 'mosque near me, UK mosques, prayer times UK, Islamic centres, masjid, find mosque';

// ─── Robots defaults ──────────────────────────────────────────
export const DEFAULT_ROBOTS = {
  index:  true,
  follow: true,
} as const;

export const NOINDEX_ROBOTS = {
  index:  false,
  follow: false,
} as const;

// ─── Sitemap priorities ───────────────────────────────────────
export const SITEMAP_PRIORITY = {
  home:   1.0,
  search: 0.9,
  city:   0.8,
  mosque: 0.8,
  static: 0.5,
} as const;

export const SITEMAP_CHANGEFREQ = {
  home:   'daily',
  mosque: 'weekly',
  city:   'weekly',
  static: 'monthly',
} as const;
