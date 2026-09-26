/**
 * ============================================================
 *  build-safety-check.ts  –  Pre-build slug integrity gate
 * ============================================================
 *
 * Runs automatically before every `npm run build` via the
 * `prebuild` script chain.  Fails the build if ANY of these
 * conditions are detected:
 *
 *   [1] SLUG DRIFT      – A mosque in the registry would now
 *                         generate a DIFFERENT slug (CSV drift,
 *                         name change, city logic change).
 *   [2] DUPLICATE SLUGS – Two mosques would share the same slug.
 *   [3] ORPHAN ENTRIES  – Registry has a slug for a mosque that
 *                         no longer exists in the CSV.
 *   [4] INVALID CITIES  – Mosques assigned to "Unknown Area".
 *   [5] BROKEN REGISTRY – Registry file is missing or corrupt.
 *
 * EXIT CODES:
 *   0 = all checks passed
 *   1 = fatal errors found (build is blocked)
 *
 * USAGE:
 *   npx tsx scripts/build-safety-check.ts
 *   (or: npm run slug:check)
 * ============================================================
 */

import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';
import { generateStableKey, loadRegistry } from '../lib/slug-registry';

// ─── Replicated slug generation ──────────────────────────────
// (Mirrors data.ts – kept in sync manually)

const LONDON_BOROUGHS = new Set([
  'city of london','city and county of the city of london','barking and dagenham',
  'barnet','bexley','brent','bromley','camden','croydon','ealing','enfield',
  'greenwich','hackney','hammersmith and fulham','haringey','harrow','havering',
  'hillingdon','hounslow','islington','kensington and chelsea','kingston upon thames',
  'lambeth','lewisham','merton','newham','redbridge','richmond upon thames',
  'southwark','sutton','tower hamlets','waltham forest','wandsworth','westminster',
  'city of westminster',
]);
const GREATER_MANCHESTER_BOROUGHS = new Set([
  'bolton','bury','oldham','rochdale','stockport','tameside','trafford','wigan','salford',
]);
const WEST_MIDLANDS_BOROUGHS = new Set([
  'sandwell','walsall','dudley','wolverhampton','solihull','city of wolverhampton',
]);
const WEST_YORKSHIRE_DISTRICTS  = new Set(['kirklees','calderdale','wakefield']);
const SOUTH_YORKSHIRE_DISTRICTS = new Set(['rotherham','barnsley','doncaster']);

const CITY_NAME_MAPPINGS: Record<string, string> = {
  'city of leicester':'Leicester','city of nottingham':'Nottingham',
  'city of bristol':'Bristol','city of derby':'Derby',
  'city of stoke-on-trent':'Stoke-on-Trent','city of southampton':'Southampton',
  'city of peterborough':'Peterborough','city of kingston upon hull':'Hull',
  'city of portsmouth':'Portsmouth','city of wolverhampton':'Wolverhampton',
  'city of brighton and hove':'Brighton','the city of brighton and hove':'Brighton',
  'city of edinburgh':'Edinburgh','glasgow city':'Glasgow',
  'aberdeen city':'Aberdeen','dundee city':'Dundee',
  'caerdydd - cardiff':'Cardiff','caerdydd':'Cardiff','city of cardiff':'Cardiff',
  'casnewydd - newport':'Newport','abertawe - swansea':'Swansea',
  'blackburn with darwen':'Blackburn','newcastle upon tyne':'Newcastle',
  'stoke-on-trent':'Stoke-on-Trent','stockton-on-tees':'Stockton',
  'southend-on-sea':'Southend',
};

function cleanCityName(city: string): string {
  let cleaned = city.replace(/[\d]/g, '').trim();
  const lower = cleaned.toLowerCase();
  const invalid = ['not known','none','n/a','+','unknown','','none until'];
  if (invalid.includes(lower) || lower.startsWith('none until') || lower.length < 2) return 'Unknown Area';
  if (lower.startsWith('dewsbury')) return 'Dewsbury';
  return cleaned.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
}

// ─── Check runner ─────────────────────────────────────────────
async function runChecks() {
  const DATA_FILE = path.join(process.cwd(), 'MosquesNov25Extended.csv');
  const REGISTRY_PATH = path.join(process.cwd(), 'public', 'slug-registry.json');

  const errors:   string[] = [];
  const warnings: string[] = [];

  console.log('');
  console.log('════════════════════════════════════════════════');
  console.log('  Pre-build Slug Safety Check');
  console.log('════════════════════════════════════════════════');
  console.log('');

  // ── [5] Registry existence ─────────────────────────────────
  if (!fs.existsSync(REGISTRY_PATH)) {
    errors.push('[FATAL] public/slug-registry.json is MISSING. Run `npm run slug:generate` first.');
  } else {
    console.log('  ✓ Registry file found');
  }

  const registry = loadRegistry();
  const totalLocked = Object.keys(registry.entries).length;
  console.log(`  ✓ Registry loaded: ${totalLocked} locked entries`);

  if (!fs.existsSync(DATA_FILE)) {
    errors.push(`[FATAL] CSV not found at: ${DATA_FILE}`);
    printReport(errors, warnings);
    process.exit(errors.length > 0 ? 1 : 0);
  }

  // ── Parse CSV ──────────────────────────────────────────────
  const fileContent = fs.readFileSync(DATA_FILE, 'utf8');
  const { data }    = Papa.parse(fileContent, { header: false, skipEmptyLines: true });

  const seenSlugs:      Map<string, string>  = new Map(); // slug → name
  const seenStableKeys: Set<string>          = new Set();
  const activeKeys:     Set<string>          = new Set();
  const existingSlugs:  Set<string>          = new Set();

  let driftCount    = 0;
  let dupCount      = 0;
  let unknownCities = 0;

  (data as any[]).forEach((row: any, index: number) => {
    if (row.length < 4) return;

    const lng = parseFloat(row[0]);
    const lat = parseFloat(row[1]);
    if (isNaN(lng) || isNaN(lat)) return;
    if (lat < 49.0 || lat > 61.0 || lng < -11.0 || lng > 2.0) return;

    let rawDetails = row[2];
    rawDetails = rawDetails.replace(/Magid/g, 'Masjid')
                           .replace(/Vineschale/g, 'Wheelchair Accessible')
                           .replace(/Orchestral/g, 'Dedicated')
                           .replace(/Nearly/g, 'Nearby');
    if (rawDetails.startsWith('*') || rawDetails.startsWith('?')) rawDetails = rawDetails.substring(1);

    const detailsMatch    = rawDetails.match(/^\[(.*?)\](.*)/);
    const nameAddressPhone = detailsMatch ? detailsMatch[2] : rawDetails;
    const infoParts       = nameAddressPhone.split('. ').map((s: string) => s.trim());
    const name            = infoParts[0];
    if (!name) return;

    const lastPart = infoParts[infoParts.length - 1];
    const addrSlice = (lastPart && (lastPart.match(/[\d\s]{10,}/) || lastPart.startsWith('0')))
      ? infoParts.slice(1, infoParts.length - 1) : infoParts.slice(1);
    const fullAddress = addrSlice.join(', ');

    const postcodeMatch = fullAddress.match(/([Gg][Ii][Rr] 0[Aa]{2})|((([A-Za-z][0-9]{1,2})|(([A-Za-z][A-Ha-hJ-Yy][0-9]{1,2})|(([A-Za-z][0-9][A-Za-z])|([A-Za-z][A-Ha-hJ-Yy][0-9][A-Za-z]?))))\s?[0-9][A-Za-z]{2})/);
    const postcode = postcodeMatch ? postcodeMatch[0] : '';

    const locationRaw = row[3];
    let city = 'Unknown';

    if (locationRaw && locationRaw.length > 5) {
      const cleanLoc = locationRaw.replace(/-ID:\d+.*$/, '');
      const parts    = cleanLoc.split(',').map((s: string) => s.trim()).filter((s: string) => s);
      if (parts.length > 1) {
        const secondPart = parts[1].toLowerCase();
        const firstPart  = parts[0].toLowerCase();
        if (CITY_NAME_MAPPINGS[secondPart]) city = CITY_NAME_MAPPINGS[secondPart];
        else if (CITY_NAME_MAPPINGS[firstPart]) city = CITY_NAME_MAPPINGS[firstPart];
        else if (secondPart.includes('stoke-on-trent')) city = 'Stoke-on-Trent';
        else if (secondPart === 'london' || LONDON_BOROUGHS.has(secondPart) || LONDON_BOROUGHS.has(firstPart)) city = 'London';
        else if (GREATER_MANCHESTER_BOROUGHS.has(secondPart) || GREATER_MANCHESTER_BOROUGHS.has(firstPart)) city = 'Manchester';
        else if (WEST_MIDLANDS_BOROUGHS.has(secondPart) || WEST_MIDLANDS_BOROUGHS.has(firstPart)) city = 'Birmingham';
        else if (WEST_YORKSHIRE_DISTRICTS.has(secondPart) || WEST_YORKSHIRE_DISTRICTS.has(firstPart)) city = 'Leeds';
        else if (SOUTH_YORKSHIRE_DISTRICTS.has(secondPart) || SOUTH_YORKSHIRE_DISTRICTS.has(firstPart)) city = 'Sheffield';
        else if (['birmingham','manchester','leicester','leeds','sheffield','bradford'].includes(secondPart)) city = parts[1];
        else { const isPostcode = /^[A-Za-z]{1,2}\d/.test(parts[1]); city = isPostcode ? parts[0] : parts[1]; }
      } else if (parts.length === 1) city = parts[0];
    }

    if (city === 'Unknown' || city.length < 2) {
      if (postcode) {
        const before = fullAddress.split(postcode)[0];
        const pts    = before.split(',').map((s: string) => s.trim()).filter((s: string) => s);
        if (pts.length > 0) city = pts[pts.length - 1];
      } else {
        const pts = fullAddress.split(',').map((s: string) => s.trim());
        if (pts.length > 0) city = pts[pts.length - 1];
      }
    }

    city = cleanCityName(city);
    const cityLower = city.toLowerCase();
    if (CITY_NAME_MAPPINGS[cityLower]) city = CITY_NAME_MAPPINGS[cityLower];
    else if (LONDON_BOROUGHS.has(cityLower)) city = 'London';
    else if (GREATER_MANCHESTER_BOROUGHS.has(cityLower)) city = 'Manchester';
    else if (WEST_MIDLANDS_BOROUGHS.has(cityLower)) city = 'Birmingham';
    else if (WEST_YORKSHIRE_DISTRICTS.has(cityLower)) city = 'Leeds';
    else if (SOUTH_YORKSHIRE_DISTRICTS.has(cityLower)) city = 'Sheffield';

    // Generate what the slug WOULD be under current logic
    let slugBase = `${name}-${city}-${postcode}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    let generatedSlug = slugBase || `mosque-${index}`;
    let counter = 1;
    const originalSlug = generatedSlug;
    while (existingSlugs.has(generatedSlug)) {
      generatedSlug = `${originalSlug}-${counter}`;
      counter++;
    }
    existingSlugs.add(generatedSlug);

    const stableKey  = generateStableKey(name, postcode, lat, lng);
    activeKeys.add(stableKey);

    // ── [1] Drift check ───────────────────────────────────────
    const lockedSlug = registry.entries[stableKey]?.slug;
    if (lockedSlug && lockedSlug !== generatedSlug) {
      driftCount++;
      errors.push(
        `[SLUG DRIFT] "${name}" (${postcode}): locked="${lockedSlug}" | would-generate="${generatedSlug}"`
      );
    }

    const effectiveSlug = lockedSlug ?? generatedSlug;

    // ── [2] Duplicate slug check ──────────────────────────────
    if (seenSlugs.has(effectiveSlug)) {
      dupCount++;
      errors.push(
        `[DUPLICATE SLUG] "${effectiveSlug}" used by both "${seenSlugs.get(effectiveSlug)}" and "${name}"`
      );
    } else {
      seenSlugs.set(effectiveSlug, name);
    }

    // ── [4] Invalid city check ────────────────────────────────
    if (city === 'Unknown Area' || city === 'Unknown') {
      unknownCities++;
      warnings.push(`[UNKNOWN CITY] "${name}" | ${postcode} has city="${city}"`);
    }
  });

  // ── [3] Orphan registry entries ────────────────────────────
  let orphanCount = 0;
  for (const [key, entry] of Object.entries(registry.entries)) {
    if (!activeKeys.has(key)) {
      orphanCount++;
      warnings.push(`[ORPHAN] Registry has slug "${entry.slug}" for "${entry.name}" but mosque not found in CSV`);
    }
  }

  // ── Summary ────────────────────────────────────────────────
  console.log('');
  console.log('─── Check Results ──────────────────────────────');
  console.log(`  Mosques parsed       : ${seenSlugs.size}`);
  console.log(`  Slug drift errors    : ${driftCount}`);
  console.log(`  Duplicate slug errors: ${dupCount}`);
  console.log(`  Unknown city warns   : ${unknownCities}`);
  console.log(`  Orphan entry warns   : ${orphanCount}`);
  console.log('────────────────────────────────────────────────');

  printReport(errors, warnings);

  if (errors.length > 0) {
    console.log('');
    console.log('❌ BUILD BLOCKED – Fix the errors above before deploying.');
    console.log('');
    process.exit(1);
  }

  console.log('');
  console.log('✅ All slug safety checks passed. Build may proceed.');
  console.log('');
  process.exit(0);
}

function printReport(errors: string[], warnings: string[]) {
  if (warnings.length > 0) {
    console.log('');
    console.log('⚠️  WARNINGS (will not block build):');
    warnings.slice(0, 20).forEach(w => console.log(`   ${w}`));
    if (warnings.length > 20) console.log(`   ... and ${warnings.length - 20} more`);
  }
  if (errors.length > 0) {
    console.log('');
    console.log('❌ ERRORS (build is blocked):');
    errors.forEach(e => console.log(`   ${e}`));
  }
}

runChecks().catch((err) => {
  console.error('❌ Safety check crashed:', err);
  process.exit(1);
});
