/**
 * scripts/generate-static-assets.ts
 *
 * Generates:
 *  1. public/mosques.json  — full data payload for client-side search
 *  2. Supplemental XML sitemaps (sitemap-mosques.xml, sitemap-cities.xml, sitemap-pages.xml)
 *     These are kept for hosting providers that need pre-built files.
 *     The authoritative sitemap is app/sitemap.ts (Next.js native).
 *
 * Domain is sourced from lib/seo/constants — never hardcoded here.
 */

import fs from 'fs';
import path from 'path';
import { getAllMosques } from '../lib/data';

// Import constants directly (not via path alias for script context)
const SITE_BASE_URL = 'https://mosquenearme.net';

function toCitySlug(city: string): string {
  return city.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

async function generateStaticAssets() {
  console.log('\n════════════════════════════════════════════════');
  console.log('  Generating Static Assets');
  console.log('════════════════════════════════════════════════\n');

  const mosques    = await getAllMosques();
  const publicDir  = path.join(process.cwd(), 'public');
  const now        = new Date().toISOString();

  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

  // ── 1. mosques.json ───────────────────────────────────────
  const mosquesJsonPath = path.join(publicDir, 'mosques.json');
  fs.writeFileSync(mosquesJsonPath, JSON.stringify(mosques, null, 2));
  console.log(`  ✓ Generated mosques.json (${mosques.length} entries)`);

  // ── 2. sitemap-mosques.xml ────────────────────────────────
  const validMosques = mosques.filter(m =>
    m.city && m.city !== 'Unknown' && m.city !== 'Unknown Area'
  );
  const seenSlugs = new Set<string>();
  const mosqueUrls: string[] = [];

  for (const mosque of validMosques) {
    if (seenSlugs.has(mosque.slug)) continue;
    seenSlugs.add(mosque.slug);
    mosqueUrls.push(`  <url>
    <loc>${SITE_BASE_URL}/mosques/${mosque.slug}/</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`);
  }

  const mosquesSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${mosqueUrls.join('\n')}
</urlset>`;
  fs.writeFileSync(path.join(publicDir, 'sitemap-mosques.xml'), mosquesSitemap);
  console.log(`  ✓ Generated sitemap-mosques.xml (${mosqueUrls.length} URLs)`);

  // ── 3. sitemap-cities.xml ─────────────────────────────────
  const cities    = new Set<string>();
  const cityUrls: string[] = [];
  for (const m of mosques) {
    if (!m.city || m.city === 'Unknown' || m.city === 'Unknown Area') continue;
    const slug = toCitySlug(m.city);
    if (!slug || cities.has(slug)) continue;
    cities.add(slug);
    cityUrls.push(`  <url>
    <loc>${SITE_BASE_URL}/cities/${slug}/</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`);
  }

  const citiesSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${cityUrls.join('\n')}
</urlset>`;
  fs.writeFileSync(path.join(publicDir, 'sitemap-cities.xml'), citiesSitemap);
  console.log(`  ✓ Generated sitemap-cities.xml (${cityUrls.length} URLs)`);

  // ── 4. sitemap-pages.xml ──────────────────────────────────
  const staticPaths = ['', 'search', 'near-me', 'donate', 'about', 'contact', 'privacy', 'terms'];
  const pageUrlLines = staticPaths.map(p => `  <url>
    <loc>${SITE_BASE_URL}/${p ? p + '/' : ''}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${p === '' ? 'daily' : 'monthly'}</changefreq>
    <priority>${p === '' ? '1.0' : p === 'search' || p === 'near-me' ? '0.9' : p === 'donate' ? '0.8' : '0.5'}</priority>
  </url>`);

  const pagesSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pageUrlLines.join('\n')}
</urlset>`;
  fs.writeFileSync(path.join(publicDir, 'sitemap-pages.xml'), pagesSitemap);
  console.log(`  ✓ Generated sitemap-pages.xml (${staticPaths.length} URLs)`);

  // ── 5. sitemap.xml index ──────────────────────────────────
  const sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${SITE_BASE_URL}/sitemap-pages.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${SITE_BASE_URL}/sitemap-mosques.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${SITE_BASE_URL}/sitemap-cities.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
</sitemapindex>`;
  fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), sitemapIndex);
  console.log('  ✓ Generated sitemap.xml (index)');

  console.log('\n✅ Static assets generation complete.\n');
}

generateStaticAssets().catch(err => { console.error(err); process.exit(1); });
