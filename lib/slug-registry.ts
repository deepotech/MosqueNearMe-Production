/**
 * ============================================================
 *  SLUG REGISTRY  –  Enterprise-grade slug locking system
 * ============================================================
 *
 * GUARANTEES:
 *   • A mosque's slug is locked the first time it is generated.
 *   • Once locked it NEVER changes – regardless of CSV order,
 *     duplicates, or data edits.
 *   • New mosques get a fresh slug; existing mosques always
 *     reuse their original slug.
 *
 * HOW IT WORKS:
 *   1. Each mosque gets a "stable key" – a SHA-256 hash of
 *      (name | postcode | rounded-lat | rounded-lng).
 *      This key is position-independent and content-derived.
 *   2. Registry file (public/slug-registry.json) stores
 *      stableKey → { slug, metadata }.
 *   3. data.ts looks up stableKey before generating any slug.
 *      If found  → use locked slug.
 *      If missing → generate new slug, lock it, persist it.
 *
 * DO NOT delete or modify public/slug-registry.json manually.
 * Run `npm run slug:generate` only once on first migration.
 * ============================================================
 */

import fs from 'fs';
import path from 'path';
import { createHash } from 'crypto';

// ─── Paths ───────────────────────────────────────────────────
const REGISTRY_PATH     = path.join(process.cwd(), 'public', 'slug-registry.json');
const REDIRECT_MAP_PATH = path.join(process.cwd(), 'public', 'redirect-map.json');

// ─── Types ───────────────────────────────────────────────────
export interface RegistryEntry {
  slug:     string;
  name:     string;
  city:     string;
  postcode: string;
  lat:      number;
  lng:      number;
  lockedAt: string;
  /** initial = first migration, new = added after migration */
  source:   'initial' | 'new';
}

export interface SlugRegistry {
  version:      number;
  generatedAt:  string;
  lastUpdated:  string;
  totalEntries: number;
  /** stableKey → RegistryEntry  (primary index) */
  entries:      Record<string, RegistryEntry>;
  /** slug → stableKey            (reverse index for fast lookup) */
  slugIndex:    Record<string, string>;
}

export interface RedirectMap {
  version:      number;
  generatedAt:  string;
  /** oldSlug → currentSlug */
  redirects:    Record<string, string>;
}

// ─── In-memory cache ─────────────────────────────────────────
let _registry:      SlugRegistry | null = null;
let _registryDirty: boolean             = false;

// ─── Stable Key Generation ───────────────────────────────────

/**
 * Generate a stable, position-independent key for a mosque.
 *
 * Uses content-based hashing so that moving a row in the CSV,
 * or inserting a duplicate, never changes the key.
 *
 * Coordinates are rounded to 4 decimal places (~11 m) to
 * absorb tiny floating-point variations in source data.
 */
export function generateStableKey(
  name:     string,
  postcode: string,
  lat:      number,
  lng:      number,
): string {
  const latR  = Math.round(lat  * 10_000);
  const lngR  = Math.round(lng  * 10_000);
  const norm  = `${name.toLowerCase().trim()}|${postcode.toLowerCase().replace(/\s+/g, '').trim()}|${latR}|${lngR}`;
  return createHash('sha256').update(norm).digest('hex').substring(0, 16);
}

// ─── Registry I/O ────────────────────────────────────────────

/**
 * Load (and cache) the slug registry from disk.
 * Returns a fresh empty registry if the file does not exist.
 */
export function loadRegistry(): SlugRegistry {
  if (_registry) return _registry;

  try {
    if (fs.existsSync(REGISTRY_PATH)) {
      const raw  = fs.readFileSync(REGISTRY_PATH, 'utf-8');
      _registry  = JSON.parse(raw) as SlugRegistry;

      // Back-fill slugIndex if missing (registry from older format)
      if (!_registry.slugIndex) {
        _registry.slugIndex = {};
        for (const [key, entry] of Object.entries(_registry.entries)) {
          _registry.slugIndex[entry.slug] = key;
        }
        _registryDirty = true;
      }

      return _registry;
    }
  } catch (err) {
    console.warn('[SlugRegistry] Failed to load registry – starting fresh:', err);
  }

  _registry = {
    version:      1,
    generatedAt:  new Date().toISOString(),
    lastUpdated:  new Date().toISOString(),
    totalEntries: 0,
    entries:      {},
    slugIndex:    {},
  };
  return _registry;
}

/**
 * Look up a locked slug by stable key.
 * Returns `undefined` for new mosques that are not yet registered.
 */
export function lookupSlug(stableKey: string): string | undefined {
  return loadRegistry().entries[stableKey]?.slug;
}

/**
 * Look up a stable key by slug (reverse index).
 * Useful for redirect resolution.
 */
export function lookupBySlug(slug: string): string | undefined {
  return loadRegistry().slugIndex[slug];
}

/**
 * Check whether a slug is already occupied by another entry.
 */
export function isSlugTaken(slug: string): boolean {
  return slug in loadRegistry().slugIndex;
}

/**
 * Register a new slug in the registry.
 *
 * IMMUTABILITY RULE: If the stableKey already has an entry,
 * this function is a no-op and returns `false`.
 * Existing slugs are NEVER overwritten.
 */
export function registerSlug(
  stableKey: string,
  slug:      string,
  name:      string,
  city:      string,
  postcode:  string,
  lat:       number,
  lng:       number,
  source:    'initial' | 'new' = 'new',
): boolean {
  const registry = loadRegistry();

  // Immutability guarantee
  if (registry.entries[stableKey]) return false;

  registry.entries[stableKey] = { slug, name, city, postcode, lat, lng, lockedAt: new Date().toISOString(), source };
  registry.slugIndex[slug]    = stableKey;
  registry.totalEntries       = Object.keys(registry.entries).length;
  registry.lastUpdated        = new Date().toISOString();
  _registryDirty              = true;

  return true;
}

/**
 * Persist registry to disk (only if modified).
 * Call this after bulk processing (e.g. at end of getAllMosques).
 */
export function saveRegistry(): void {
  if (!_registryDirty || !_registry) return;

  const dir = path.dirname(REGISTRY_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  fs.writeFileSync(REGISTRY_PATH, JSON.stringify(_registry, null, 2), 'utf-8');
  _registryDirty = false;
  console.log(`[SlugRegistry] ✓ Saved ${_registry.totalEntries} entries`);
}

// ─── Redirect Map I/O ────────────────────────────────────────

/** Load or create the redirect map. */
export function loadRedirectMap(): RedirectMap {
  try {
    if (fs.existsSync(REDIRECT_MAP_PATH)) {
      return JSON.parse(fs.readFileSync(REDIRECT_MAP_PATH, 'utf-8')) as RedirectMap;
    }
  } catch (err) {
    console.warn('[SlugRegistry] Failed to load redirect map:', err);
  }
  return { version: 1, generatedAt: new Date().toISOString(), redirects: {} };
}

/** Add an oldSlug → newSlug redirect (no-op if identical). */
export function addRedirect(map: RedirectMap, oldSlug: string, newSlug: string): void {
  if (oldSlug !== newSlug) map.redirects[oldSlug] = newSlug;
}

/** Save the redirect map to disk. */
export function saveRedirectMap(map: RedirectMap): void {
  const dir = path.dirname(REDIRECT_MAP_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(REDIRECT_MAP_PATH, JSON.stringify(map, null, 2), 'utf-8');
  console.log(`[SlugRegistry] ✓ Saved ${Object.keys(map.redirects).length} redirects`);
}

/** Reset in-memory cache (for testing). */
export function clearRegistryCache(): void {
  _registry      = null;
  _registryDirty = false;
}
