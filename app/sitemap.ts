import type { MetadataRoute } from 'next';
import { getAllMosques } from '@/lib/data';
import { SITE_BASE_URL, SITEMAP_CHANGEFREQ, SITEMAP_PRIORITY } from '@/lib/seo/constants';
import { toCitySlug } from '@/lib/seo/url';

/**
 * app/sitemap.ts — Next.js native sitemap generation
 *
 * Generates a complete, deduplicated, canonical sitemap with:
 *   - All mosque pages (filtered for valid cities)
 *   - All city pages (deduplicated)
 *   - All static pages
 *
 * Works with output: 'export' — Next.js generates sitemap.xml at build time.
 * This replaces the manual sitemap generation in generate-static-assets.ts.
 */

export const dynamic = 'force-static';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const mosques = await getAllMosques();

  // ── Static pages ──────────────────────────────────────────
  const staticPages: MetadataRoute.Sitemap = [
    {
      url:        `${SITE_BASE_URL}/`,
      lastModified: new Date(),
      changeFrequency: SITEMAP_CHANGEFREQ.home as MetadataRoute.Sitemap[0]['changeFrequency'],
      priority:   SITEMAP_PRIORITY.home,
    },
    {
      url:        `${SITE_BASE_URL}/search/`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority:   SITEMAP_PRIORITY.search,
    },
    {
      url:        `${SITE_BASE_URL}/near-me/`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority:   SITEMAP_PRIORITY.search,
    },
    {
      url:        `${SITE_BASE_URL}/about/`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority:   SITEMAP_PRIORITY.static,
    },
    {
      url:        `${SITE_BASE_URL}/contact/`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority:   SITEMAP_PRIORITY.static,
    },
    {
      url:        `${SITE_BASE_URL}/privacy/`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority:   SITEMAP_PRIORITY.static,
    },
    {
      url:        `${SITE_BASE_URL}/terms/`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority:   SITEMAP_PRIORITY.static,
    },
  ];

  // ── City pages (deduplicated, validated) ──────────────────
  const validCities  = new Set<string>();
  const cityPages:  MetadataRoute.Sitemap = [];

  for (const mosque of mosques) {
    if (
      !mosque.city ||
      mosque.city === 'Unknown' ||
      mosque.city === 'Unknown Area' ||
      mosque.city.length < 2
    ) continue;

    const slug = toCitySlug(mosque.city);
    if (!slug || validCities.has(slug)) continue;

    validCities.add(slug);
    cityPages.push({
      url:        `${SITE_BASE_URL}/cities/${slug}/`,
      lastModified: new Date(),
      changeFrequency: SITEMAP_CHANGEFREQ.city as MetadataRoute.Sitemap[0]['changeFrequency'],
      priority:   SITEMAP_PRIORITY.city,
    });
  }

  // ── Mosque pages (validated, no unknown cities) ───────────
  const seenSlugs     = new Set<string>();
  const mosquePages: MetadataRoute.Sitemap = [];

  for (const mosque of mosques) {
    // Skip if no valid city (page would show nothing useful)
    if (!mosque.city || mosque.city === 'Unknown' || mosque.city === 'Unknown Area') continue;
    // Skip duplicate slugs (safety)
    if (seenSlugs.has(mosque.slug)) continue;

    seenSlugs.add(mosque.slug);
    mosquePages.push({
      url:        `${SITE_BASE_URL}/mosques/${mosque.slug}/`,
      lastModified: new Date(),
      changeFrequency: SITEMAP_CHANGEFREQ.mosque as MetadataRoute.Sitemap[0]['changeFrequency'],
      priority:   SITEMAP_PRIORITY.mosque,
    });
  }

  console.log(`[Sitemap] ${staticPages.length} static | ${cityPages.length} cities | ${mosquePages.length} mosques`);

  return [...staticPages, ...cityPages, ...mosquePages];
}
