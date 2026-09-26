/**
 * scripts/check-indexability.ts
 * ─────────────────────────────────────────────────────────────
 * Detects pages that should be indexable but are at risk of
 * being noindexed, and pages that SHOULD be noindexed.
 *
 * Checks:
 *  - Mosque pages with unknown/missing city (should be noindexed)
 *  - Mosque pages with missing coordinates (thin content risk)
 *  - City pages with only 1 mosque (thin content risk)
 *  - Pages that would generate duplicate descriptions
 *  - Mosques with identical names in same city (canonicalization risk)
 *
 * Outputs a priority fix list sorted by impact.
 *
 * Run: npx tsx scripts/check-indexability.ts
 */

import { getAllMosques } from '../lib/data';

interface IndexabilityIssue {
  type:    'noindex-risk' | 'thin-content' | 'duplicate-risk' | 'canonical-risk';
  slug:    string;
  city:    string;
  name:    string;
  reason:  string;
  action:  string;
}

async function checkIndexability(): Promise<void> {
  console.log('\n════════════════════════════════════════════════');
  console.log('  Indexability Audit');
  console.log('════════════════════════════════════════════════\n');

  const mosques = await getAllMosques();
  const issues: IndexabilityIssue[] = [];

  // Count mosques per city
  const cityCount: Record<string, number> = {};
  for (const m of mosques) {
    if (m.city) cityCount[m.city] = (cityCount[m.city] ?? 0) + 1;
  }

  // Track duplicate names within same city
  const cityNameSeen: Record<string, Set<string>> = {};

  for (const m of mosques) {
    // 1. Unknown / missing city → noindex risk
    if (!m.city || m.city === 'Unknown' || m.city === 'Unknown Area') {
      issues.push({
        type: 'noindex-risk', slug: m.slug, city: m.city ?? '',
        name: m.name,
        reason: 'No valid city — page has no geographic context',
        action: 'Add noindex to this page OR fix city data in CSV',
      });
      continue;
    }

    // 2. Missing GPS coords → thin content risk for map-dependent page
    if (!m.lat || !m.lng) {
      issues.push({
        type: 'thin-content', slug: m.slug, city: m.city,
        name: m.name,
        reason: 'Missing GPS coordinates — map panel will be empty',
        action: 'Add coordinates to CSV to enable map and nearby mosque features',
      });
    }

    // 3. Duplicate mosque name in same city → canonical confusion risk
    cityNameSeen[m.city] ??= new Set();
    if (cityNameSeen[m.city].has(m.name.toLowerCase().trim())) {
      issues.push({
        type: 'canonical-risk', slug: m.slug, city: m.city,
        name: m.name,
        reason: `Duplicate name "${m.name}" in ${m.city} — Google may canonicalize to wrong URL`,
        action: 'Differentiate page titles with address; ensure slug is unique (already locked)',
      });
    }
    cityNameSeen[m.city].add(m.name.toLowerCase().trim());

    // 4. Missing address → thin content
    if (!m.address?.trim()) {
      issues.push({
        type: 'thin-content', slug: m.slug, city: m.city,
        name: m.name,
        reason: 'No street address — description and schema are incomplete',
        action: 'Add address to CSV',
      });
    }
  }

  // 5. Single-mosque cities → thin city pages
  const thinCities = Object.entries(cityCount).filter(([, c]) => c === 1);
  if (thinCities.length > 0) {
    console.log(`  ⚠ ${thinCities.length} cities have only 1 mosque — city pages may be thin.`);
    console.log('    These are low priority but consider combining into region pages later.\n');
  }

  // ── Output ────────────────────────────────────────────────
  const noindexRisks  = issues.filter(i => i.type === 'noindex-risk');
  const thinContent   = issues.filter(i => i.type === 'thin-content');
  const duplicateRisk = issues.filter(i => i.type === 'canonical-risk');

  console.log('─── Results ─────────────────────────────────────');
  console.log(`  Noindex risks    : ${noindexRisks.length}`);
  console.log(`  Thin content     : ${thinContent.length}`);
  console.log(`  Canonical risks  : ${duplicateRisk.length}`);
  console.log(`  Thin city pages  : ${thinCities.length}`);
  console.log('─────────────────────────────────────────────────\n');

  if (noindexRisks.length > 0) {
    console.log('🚨 NOINDEX RISKS (fix immediately):');
    noindexRisks.forEach(i => {
      console.log(`   /mosques/${i.slug}/`);
      console.log(`     Reason: ${i.reason}`);
      console.log(`     Action: ${i.action}\n`);
    });
  }

  if (duplicateRisk.length > 0) {
    console.log('⚠  CANONICAL RISKS (fix before next build):');
    duplicateRisk.slice(0, 10).forEach(i => {
      console.log(`   /mosques/${i.slug}/ — ${i.reason}`);
    });
    if (duplicateRisk.length > 10) console.log(`   ... and ${duplicateRisk.length - 10} more`);
    console.log('');
  }

  if (thinContent.length > 0) {
    console.log(`ℹ  THIN CONTENT (${thinContent.length} pages — low priority):`);
    thinContent.slice(0, 5).forEach(i => console.log(`   /mosques/${i.slug}/ — ${i.reason}`));
    if (thinContent.length > 5) console.log(`   ... and ${thinContent.length - 5} more`);
    console.log('');
  }

  const indexabilityScore = Math.max(0, Math.round(
    100 - (noindexRisks.length / mosques.length * 100 * 5)
        - (duplicateRisk.length / mosques.length * 100 * 2)
        - (thinContent.length / mosques.length * 100 * 0.5)
  ));

  console.log(`  Indexability Score: ${indexabilityScore}/100 ${indexabilityScore >= 95 ? '🟢' : indexabilityScore >= 80 ? '🟡' : '🔴'}`);

  if (noindexRisks.length > 0) {
    console.log('\n❌ Indexability check FAILED — fix noindex risks.\n');
    process.exit(1);
  }

  console.log('\n✅ Indexability check passed.\n');
}

checkIndexability().catch(err => { console.error(err); process.exit(1); });
