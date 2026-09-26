/**
 * scripts/check-sitemap.ts
 * Validates the generated sitemap(s) for SEO correctness.
 *
 * Checks:
 *  - All URLs use https://mosquenearme.net
 *  - No http:// URLs
 *  - No mosquenearme.com URLs
 *  - No duplicate URLs
 *  - All mosque slugs exist in the registry
 *  - All city slugs map to real cities in the data
 *  - Proper trailing slashes
 *
 * Run: npx tsx scripts/check-sitemap.ts
 */

import fs from 'fs';
import path from 'path';
import { getAllMosques } from '../lib/data';

const CORRECT_DOMAIN = 'https://mosquenearme.net';
const WRONG_DOMAINS  = ['http://mosquenearme.net', 'https://mosquenearme.com', 'http://mosquenearme.com'];

interface CheckResult {
  errors:   string[];
  warnings: string[];
}

function extractUrlsFromXml(xml: string): string[] {
  const matches = xml.match(/<loc>(.*?)<\/loc>/g) || [];
  return matches.map(m => m.replace(/<\/?loc>/g, '').trim());
}

async function checkSitemap(): Promise<void> {
  console.log('\n════════════════════════════════════════════════');
  console.log('  Sitemap Integrity Check');
  console.log('════════════════════════════════════════════════\n');

  const result: CheckResult = { errors: [], warnings: [] };
  const publicDir = path.join(process.cwd(), 'public');

  // ── Load all data ──────────────────────────────────────────
  const mosques    = await getAllMosques();
  const validSlugs = new Set(mosques.map(m => m.slug));
  const validCities = new Set(
    mosques
      .filter(m => m.city && m.city !== 'Unknown' && m.city !== 'Unknown Area')
      .map(m => m.city.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''))
  );

  // ── Find sitemap files ─────────────────────────────────────
  const sitemapFiles = [
    'sitemap.xml',
    'sitemap-mosques.xml',
    'sitemap-cities.xml',
    'sitemap-pages.xml',
  ].filter(f => fs.existsSync(path.join(publicDir, f)));

  if (sitemapFiles.length === 0) {
    console.log('⚠️  No sitemap files found in public/. Run npm run build first.\n');
    process.exit(0);
  }

  const allUrls: string[] = [];
  const seenUrls = new Set<string>();

  // ── Check each sitemap file ───────────────────────────────
  for (const file of sitemapFiles) {
    const filePath = path.join(publicDir, file);
    const xml      = fs.readFileSync(filePath, 'utf-8');
    const urls     = extractUrlsFromXml(xml);

    console.log(`  Checking ${file} (${urls.length} URLs)`);

    for (const url of urls) {
      allUrls.push(url);

      // 1. Wrong domain
      for (const bad of WRONG_DOMAINS) {
        if (url.startsWith(bad)) {
          result.errors.push(`[WRONG DOMAIN] ${url} in ${file}`);
        }
      }

      // 2. Correct domain check
      if (!url.startsWith(CORRECT_DOMAIN)) {
        result.errors.push(`[INVALID URL] ${url} does not start with ${CORRECT_DOMAIN}`);
        continue;
      }

      // 3. Duplicate URL
      if (seenUrls.has(url)) {
        result.errors.push(`[DUPLICATE] ${url} appears more than once`);
      }
      seenUrls.add(url);

      // 4. Trailing slash (skip root)
      const urlPath = url.replace(CORRECT_DOMAIN, '');
      if (urlPath !== '/' && !urlPath.endsWith('/')) {
        result.warnings.push(`[NO TRAILING SLASH] ${url}`);
      }

      // 5. Validate mosque slugs
      if (url.includes('/mosques/')) {
        const slug = urlPath.replace('/mosques/', '').replace(/\//g, '');
        if (slug && !validSlugs.has(slug)) {
          result.errors.push(`[ORPHAN MOSQUE] ${url} — slug "${slug}" not in registry`);
        }
      }

      // 6. Validate city slugs
      if (url.includes('/cities/')) {
        const citySlug = urlPath.replace('/cities/', '').replace(/\//g, '');
        if (citySlug && !validCities.has(citySlug)) {
          result.warnings.push(`[UNKNOWN CITY] ${url} — "${citySlug}" not in data`);
        }
      }
    }
  }

  // ── Report ────────────────────────────────────────────────
  console.log('\n─── Sitemap Audit Results ──────────────────────');
  console.log(`  Files checked  : ${sitemapFiles.length}`);
  console.log(`  Total URLs     : ${allUrls.length}`);
  console.log(`  Unique URLs    : ${seenUrls.size}`);
  console.log(`  Errors         : ${result.errors.length}`);
  console.log(`  Warnings       : ${result.warnings.length}`);
  console.log('─────────────────────────────────────────────────\n');

  if (result.errors.length > 0) {
    console.log('❌ ERRORS (must fix before deploying):');
    result.errors.forEach(e => console.log(`   ${e}`));
    console.log('');
  }

  if (result.warnings.length > 0 && result.warnings.length <= 20) {
    console.log('⚠️  WARNINGS:');
    result.warnings.forEach(w => console.log(`   ${w}`));
    console.log('');
  } else if (result.warnings.length > 20) {
    console.log(`⚠️  ${result.warnings.length} warnings (showing first 10):`);
    result.warnings.slice(0, 10).forEach(w => console.log(`   ${w}`));
    console.log('');
  }

  if (result.errors.length > 0) {
    console.log('❌ Sitemap check FAILED.\n');
    process.exit(1);
  }

  console.log('✅ Sitemap check passed.\n');
}

checkSitemap().catch(err => { console.error(err); process.exit(1); });
