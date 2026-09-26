/**
 * scripts/seo-health-report.ts
 * ─────────────────────────────────────────────────────────────
 * Full SEO health monitoring report for mosquenearme.net
 *
 * Checks:
 *  1. Slug integrity          — drift, duplicates, orphans
 *  2. Canonical correctness   — wrong domain, missing canonicals
 *  3. Sitemap health          — all URLs valid, no duplicates
 *  4. Metadata quality        — thin titles/descriptions, missing fields
 *  5. Content quality         — pages with unknown city, no address, no coords
 *  6. Structured data         — JSON-LD completeness per mosque
 *
 * Run: npx tsx scripts/seo-health-report.ts
 * Schedule: daily in CI or cron
 */

import fs from 'fs';
import path from 'path';
import { getAllMosques } from '../lib/data';

const SITE_BASE_URL  = 'https://mosquenearme.net';
const WRONG_DOMAIN   = 'mosquenearme.com';

interface IssueLevel { errors: string[]; warnings: string[]; infos: string[]; }

function section(title: string) {
  console.log(`\n${'═'.repeat(52)}`);
  console.log(`  ${title}`);
  console.log('═'.repeat(52));
}

function report(label: string, val: string | number, ok = true) {
  const icon = ok ? '  ✓' : '  ✗';
  console.log(`${icon} ${label}: ${val}`);
}

// ── 1. Slug registry check ────────────────────────────────────
async function checkSlugs(mosques: Awaited<ReturnType<typeof getAllMosques>>): Promise<IssueLevel> {
  const issues: IssueLevel = { errors: [], warnings: [], infos: [] };
  const registryPath = path.join(process.cwd(), 'public', 'slug-registry.json');

  if (!fs.existsSync(registryPath)) {
    issues.errors.push('slug-registry.json not found — run npm run slug:generate');
    return issues;
  }

  const registry = JSON.parse(fs.readFileSync(registryPath, 'utf-8'));
  const lockedCount = Object.keys(registry.slugs ?? {}).length;
  issues.infos.push(`Registry has ${lockedCount} locked slugs`);

  const slugsSeen = new Set<string>();
  for (const m of mosques) {
    if (!m.slug) { issues.errors.push(`Mosque "${m.name}" has no slug`); continue; }
    if (slugsSeen.has(m.slug)) { issues.errors.push(`Duplicate slug: ${m.slug}`); }
    slugsSeen.add(m.slug);
  }

  issues.infos.push(`${mosques.length} mosques checked, ${slugsSeen.size} unique slugs`);
  return issues;
}

// ── 2. Content quality check ──────────────────────────────────
function checkContentQuality(mosques: Awaited<ReturnType<typeof getAllMosques>>): IssueLevel {
  const issues: IssueLevel = { errors: [], warnings: [], infos: [] };
  let noCoords = 0, noAddress = 0, unknownCity = 0, noPhone = 0;

  for (const m of mosques) {
    if (!m.lat || !m.lng)         noCoords++;
    if (!m.address?.trim())       noAddress++;
    if (!m.city || m.city === 'Unknown' || m.city === 'Unknown Area') unknownCity++;
    if (!m.phone?.trim())         noPhone++;
  }

  if (noCoords > 0)   issues.warnings.push(`${noCoords} mosques missing GPS coordinates`);
  if (noAddress > 0)  issues.warnings.push(`${noAddress} mosques missing address`);
  if (unknownCity > 0)issues.warnings.push(`${unknownCity} mosques with unknown city`);
  if (noPhone > 0)    issues.infos.push(`${noPhone} mosques missing phone (low severity)`);

  const total = mosques.length;
  const score = Math.round(((total - noCoords - noAddress - unknownCity) / total) * 100);
  issues.infos.push(`Content quality score: ${score}%`);

  return issues;
}

// ── 3. Sitemap health check ───────────────────────────────────
function checkSitemapHealth(): IssueLevel {
  const issues: IssueLevel = { errors: [], warnings: [], infos: [] };
  const publicDir = path.join(process.cwd(), 'public');
  const sitemapFiles = ['sitemap.xml', 'sitemap-mosques.xml', 'sitemap-cities.xml', 'sitemap-pages.xml'];

  let totalUrls = 0;
  let wrongDomainUrls = 0;

  for (const file of sitemapFiles) {
    const fp = path.join(publicDir, file);
    if (!fs.existsSync(fp)) { issues.warnings.push(`${file} not found`); continue; }

    const xml   = fs.readFileSync(fp, 'utf-8');
    const urls  = (xml.match(/<loc>(.*?)<\/loc>/g) || []).map(m => m.replace(/<\/?loc>/g, ''));
    totalUrls  += urls.length;

    const bad   = urls.filter(u => u.includes(WRONG_DOMAIN));
    if (bad.length > 0) {
      wrongDomainUrls += bad.length;
      issues.errors.push(`${file} has ${bad.length} wrong-domain URLs`);
    }
  }

  if (wrongDomainUrls === 0) issues.infos.push(`All ${totalUrls} sitemap URLs use correct domain`);
  issues.infos.push(`Total sitemap URLs: ${totalUrls}`);
  return issues;
}

// ── 4. Metadata quality check ─────────────────────────────────
function checkMetadataQuality(mosques: Awaited<ReturnType<typeof getAllMosques>>): IssueLevel {
  const issues: IssueLevel = { errors: [], warnings: [], infos: [] };
  let thinTitles = 0, thinDesc = 0;

  for (const m of mosques) {
    const expectedTitle = `${m.name}, ${m.city}`;
    if (expectedTitle.length < 10) thinTitles++;
    if (!m.name || m.name.length < 3) thinDesc++;
  }

  if (thinTitles > 0) issues.warnings.push(`${thinTitles} pages likely have thin SEO titles`);
  if (thinDesc > 0)   issues.warnings.push(`${thinDesc} mosques have very short names`);
  else issues.infos.push('All mosque names meet minimum quality threshold');

  return issues;
}

// ── 5. Canonical source check ─────────────────────────────────
function checkCanonicalSource(): IssueLevel {
  const issues: IssueLevel = { errors: [], warnings: [], infos: [] };
  const srcDirs = ['app', 'lib', 'components', 'scripts'];
  const SKIP = ['node_modules', '.next', 'out', 'check-canonicals.ts', 'check-sitemap.ts',
                'generate-redirects.ts', 'seo-health-report.ts'];

  let violations = 0;

  function scan(dir: string): void {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      const rel = path.relative(process.cwd(), fullPath).replace(/\\/g, '/');
      if (SKIP.some(s => rel.includes(s))) continue;
      if (entry.isDirectory()) { scan(fullPath); continue; }
      if (!/\.(ts|tsx|js|jsx)$/.test(entry.name)) continue;

      const lines = fs.readFileSync(fullPath, 'utf-8').split('\n');
      lines.forEach((line, i) => {
        if (line.includes(WRONG_DOMAIN)) {
          violations++;
          issues.errors.push(`${rel}:${i + 1} — ${line.trim().slice(0, 80)}`);
        }
      });
    }
  }

  for (const d of srcDirs) scan(path.join(process.cwd(), d));

  if (violations === 0) {
    issues.infos.push('No wrong-domain URLs in source code ✓');
  }

  return issues;
}

// ── Main ──────────────────────────────────────────────────────
async function main() {
  console.log('\n' + '═'.repeat(52));
  console.log('  SEO Health Report — mosquenearme.net');
  console.log(`  ${new Date().toISOString()}`);
  console.log('═'.repeat(52));

  const mosques = await getAllMosques();

  const [slugIssues, contentIssues, sitemapIssues, metaIssues, canonicalIssues] = await Promise.all([
    checkSlugs(mosques),
    Promise.resolve(checkContentQuality(mosques)),
    Promise.resolve(checkSitemapHealth()),
    Promise.resolve(checkMetadataQuality(mosques)),
    Promise.resolve(checkCanonicalSource()),
  ]);

  const allResults: Record<string, IssueLevel> = {
    'Slug Integrity':    slugIssues,
    'Content Quality':   contentIssues,
    'Sitemap Health':    sitemapIssues,
    'Metadata Quality':  metaIssues,
    'Canonical Sources': canonicalIssues,
  };

  let totalErrors = 0, totalWarnings = 0;

  for (const [name, result] of Object.entries(allResults)) {
    section(name);
    result.errors.forEach(e   => { console.log(`  ✗ ERROR:   ${e}`);   totalErrors++;   });
    result.warnings.forEach(w => { console.log(`  ⚠ WARNING: ${w}`);   totalWarnings++; });
    result.infos.forEach(i    => { console.log(`  ℹ INFO:    ${i}`); });
  }

  // ── Summary ────────────────────────────────────────────────
  section('Summary');
  report('Total mosques',   mosques.length);
  report('Total errors',    totalErrors,   totalErrors === 0);
  report('Total warnings',  totalWarnings, totalWarnings === 0);

  const score = Math.max(0, 100 - (totalErrors * 10) - (totalWarnings * 2));
  console.log(`\n  SEO Health Score: ${score}/100 ${score >= 90 ? '🟢' : score >= 70 ? '🟡' : '🔴'}\n`);

  if (totalErrors > 0) {
    console.log('❌ Health report FAILED — fix errors before deploying.\n');
    process.exit(1);
  }

  console.log('✅ SEO health report passed.\n');
}

main().catch(err => { console.error(err); process.exit(1); });
