/**
 * ============================================================
 *  generate-slug-registry.ts
 *  ONE-TIME MIGRATION SCRIPT  –  Run ONCE, then never again.
 * ============================================================
 *
 * PURPOSE:
 *   Reads the CSV with the EXACT same logic currently used by
 *   data.ts, captures every slug that is live today, and locks
 *   them permanently in public/slug-registry.json.
 *
 * SAFETY:
 *   • Running it a second time is safe – it only adds NEW entries.
 *   • It never overwrites or changes existing locked slugs.
 *   • It prints a full audit report when done.
 *
 * USAGE:
 *   npx tsx scripts/generate-slug-registry.ts
 *   (or: npm run slug:generate)
 *
 * After running, commit public/slug-registry.json to git and
 * NEVER delete it.
 * ============================================================
 */

import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';
import {
  generateStableKey,
  loadRegistry,
  registerSlug,
  saveRegistry,
  loadRedirectMap,
  saveRedirectMap,
} from '../lib/slug-registry';

// ─── Replicated city/borough sets from data.ts ───────────────
// IMPORTANT: These MUST stay in sync with lib/data.ts

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
const WEST_YORKSHIRE_DISTRICTS = new Set(['kirklees','calderdale','wakefield']);
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

// ─── Replicated slug generation (must match data.ts exactly) ─
function generateSlugFromData(
  name: string, city: string, postcode: string, index: number,
  existingSlugs: Set<string>,
): string {
  let slugBase = `${name}-${city}-${postcode}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  let slug = slugBase || `mosque-${index}`;
  let counter = 1;
  const originalSlug = slug;
  while (existingSlugs.has(slug)) {
    slug = `${originalSlug}-${counter}`;
    counter++;
  }
  existingSlugs.add(slug);
  return slug;
}

// ─── Main ─────────────────────────────────────────────────────
async function generateRegistry() {
  const DATA_FILE = path.join(process.cwd(), 'MosquesNov25Extended.csv');

  if (!fs.existsSync(DATA_FILE)) {
    console.error(`❌ CSV not found at: ${DATA_FILE}`);
    process.exit(1);
  }

  console.log('');
  console.log('════════════════════════════════════════════════');
  console.log('  Slug Registry Generator  –  ONE-TIME MIGRATION');
  console.log('════════════════════════════════════════════════');
  console.log('');

  const registry    = loadRegistry();
  const redirectMap = loadRedirectMap();

  const alreadyLocked  = Object.keys(registry.entries).length;
  const fileContent    = fs.readFileSync(DATA_FILE, 'utf8');
  const { data }       = Papa.parse(fileContent, { header: false, skipEmptyLines: true });

  const existingSlugs  = new Set<string>();
  let   newlyLocked    = 0;
  let   alreadySkipped = 0;
  let   collisions     = 0;
  let   invalid        = 0;

  (data as any[]).forEach((row: any, index: number) => {
    if (row.length < 4) { invalid++; return; }

    const lng = parseFloat(row[0]);
    const lat = parseFloat(row[1]);
    if (isNaN(lng) || isNaN(lat)) { invalid++; return; }
    if (lat < 49.0 || lat > 61.0 || lng < -11.0 || lng > 2.0) { invalid++; return; }

    let rawDetails = row[2];
    rawDetails = rawDetails.replace(/Magid/g, 'Masjid')
                           .replace(/Vineschale/g, 'Wheelchair Accessible')
                           .replace(/Orchestral/g, 'Dedicated')
                           .replace(/Nearly/g, 'Nearby');

    if (rawDetails.startsWith('*') || rawDetails.startsWith('?')) {
      rawDetails = rawDetails.substring(1);
    }

    const detailsMatch = rawDetails.match(/^\[(.*?)\](.*)/);
    const nameAddressPhone = detailsMatch ? detailsMatch[2] : rawDetails;
    const infoParts   = nameAddressPhone.split('. ').map((s: string) => s.trim());
    const name        = infoParts[0];
    if (!name) { invalid++; return; }

    const addressParts = infoParts.slice(1);
    const lastPart     = infoParts[infoParts.length - 1];
    const addrSlice    = (lastPart && (lastPart.match(/[\d\s]{10,}/) || lastPart.startsWith('0')))
      ? infoParts.slice(1, infoParts.length - 1)
      : addressParts;
    const fullAddress  = addrSlice.join(', ');

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
        else if (secondPart.includes('stoke-on-trent') || secondPart.includes('stoke on trent')) city = 'Stoke-on-Trent';
        else if (secondPart === 'london' || LONDON_BOROUGHS.has(secondPart) || LONDON_BOROUGHS.has(firstPart)) city = 'London';
        else if (GREATER_MANCHESTER_BOROUGHS.has(secondPart) || GREATER_MANCHESTER_BOROUGHS.has(firstPart)) city = 'Manchester';
        else if (WEST_MIDLANDS_BOROUGHS.has(secondPart) || WEST_MIDLANDS_BOROUGHS.has(firstPart)) city = 'Birmingham';
        else if (WEST_YORKSHIRE_DISTRICTS.has(secondPart) || WEST_YORKSHIRE_DISTRICTS.has(firstPart)) city = 'Leeds';
        else if (SOUTH_YORKSHIRE_DISTRICTS.has(secondPart) || SOUTH_YORKSHIRE_DISTRICTS.has(firstPart)) city = 'Sheffield';
        else if (['birmingham','manchester','leicester','leeds','sheffield','bradford'].includes(secondPart)) city = parts[1];
        else {
          const isPostcode = /^[A-Za-z]{1,2}\d/.test(parts[1]);
          city = isPostcode ? parts[0] : parts[1];
        }
      } else if (parts.length === 1) {
        city = parts[0];
      }
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

    // Generate slug using the EXACT current algorithm
    const slug      = generateSlugFromData(name, city, postcode, index, existingSlugs);
    const stableKey = generateStableKey(name, postcode, lat, lng);

    // Check if already locked (skip, but also check for drift)
    const lockedSlug = registry.entries[stableKey]?.slug;
    if (lockedSlug) {
      if (lockedSlug !== slug) {
        console.warn(`⚠️  DRIFT detected for "${name}": locked="${lockedSlug}", generated="${slug}" – keeping locked slug`);
        collisions++;
      } else {
        alreadySkipped++;
      }
      return;
    }

    // Register the slug
    const registered = registerSlug(stableKey, slug, name, city, postcode, lat, lng, 'initial');
    if (registered) {
      newlyLocked++;
    }
  });

  saveRegistry();

  // Print audit report
  const totalLocked = Object.keys(loadRegistry().entries).length;
  console.log('');
  console.log('─── Audit Report ───────────────────────────────');
  console.log(`  CSV rows processed   : ${(data as any[]).length}`);
  console.log(`  Invalid / skipped    : ${invalid}`);
  console.log(`  Already locked       : ${alreadySkipped}`);
  console.log(`  Newly locked         : ${newlyLocked}`);
  console.log(`  Drift warnings       : ${collisions}`);
  console.log(`  Total in registry    : ${totalLocked}`);
  console.log('────────────────────────────────────────────────');
  console.log('');
  console.log('✅ Registry saved to: public/slug-registry.json');
  console.log('');
  console.log('NEXT STEPS:');
  console.log('  1. git add public/slug-registry.json && git commit -m "chore: lock slug registry"');
  console.log('  2. Run `npm run redirects:generate` to generate platform redirect files');
  console.log('  3. Deploy – slugs are now permanently locked');
  console.log('');
}

generateRegistry().catch((err) => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
