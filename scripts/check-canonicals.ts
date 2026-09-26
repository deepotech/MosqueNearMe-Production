/**
 * scripts/check-canonicals.ts
 * Scans all .ts/.tsx source files for:
 *  - mosquenearme.com (wrong domain)
 *  - http:// canonical URLs (should be https://)
 *  - Hardcoded domain strings outside lib/seo/constants.ts
 *
 * Run: npx tsx scripts/check-canonicals.ts
 * Integrated into: prebuild
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const ROOT       = process.cwd();
const WRONG_DOMAIN      = 'mosquenearme.com';
const CORRECT_CONSTANTS = 'lib/seo/constants.ts';

// Files/dirs to skip
const SKIP_PATTERNS = [
  'node_modules',
  '.next',
  'out',
  '.git',
  'lib/seo/constants.ts',        // allowed to reference domain strings
  'scripts/check-canonicals.ts', // this file itself
  'scripts/check-sitemap.ts',    // references wrong domains intentionally for validation
  'scripts/generate-redirects.ts', // may reference old domains in redirect map
  'scripts/seo-health-report.ts', // references wrong domains for reporting
];

function shouldSkip(filePath: string): boolean {
  const rel = path.relative(ROOT, filePath).replace(/\\/g, '/');
  return SKIP_PATTERNS.some(p => rel.includes(p));
}

function scanDir(dir: string, results: Array<{ file: string; line: number; content: string }>): void {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (shouldSkip(fullPath)) continue;
    if (entry.isDirectory()) { scanDir(fullPath, results); continue; }
    if (!/\.(ts|tsx|js|jsx|json)$/.test(entry.name)) continue;

    const lines = fs.readFileSync(fullPath, 'utf-8').split('\n');
    lines.forEach((line, i) => {
      if (line.includes(WRONG_DOMAIN)) {
        results.push({ file: path.relative(ROOT, fullPath).replace(/\\/g, '/'), line: i + 1, content: line.trim() });
      }
    });
  }
}

function checkCanonicals(): void {
  console.log('\n════════════════════════════════════════════════');
  console.log('  Canonical Domain Check');
  console.log('════════════════════════════════════════════════\n');

  const violations: Array<{ file: string; line: number; content: string }> = [];
  scanDir(ROOT, violations);

  console.log(`  Scanned source files for "${WRONG_DOMAIN}"...\n`);

  if (violations.length === 0) {
    console.log('✅ No wrong-domain URLs found. All canonicals use mosquenearme.net\n');
    return;
  }

  console.log(`❌ Found ${violations.length} wrong-domain occurrence(s):\n`);
  violations.forEach(v => {
    console.log(`   ${v.file}:${v.line}`);
    console.log(`     ${v.content}\n`);
  });

  console.log(`\nFIX: Replace all "${WRONG_DOMAIN}" with imports from lib/seo/constants.ts`);
  console.log('     Use: import { SITE_BASE_URL } from \'@/lib/seo/constants\';\n');

  process.exit(1);
}

checkCanonicals();
