/**
 * lib/seo/url.ts
 * Type-safe, centralized URL builders.
 * Every URL in the site MUST be generated from here.
 * Never construct URLs with string concatenation elsewhere.
 */

import { SITE_BASE_URL } from './constants';

// ─── Route URL builders ───────────────────────────────────────

/** Always returns https://mosquenearme.net (no trailing slash) */
export const homeUrl = (): string => SITE_BASE_URL;

/** /mosques/[slug]/ */
export const mosqueUrl = (slug: string): string =>
  `${SITE_BASE_URL}/mosques/${slug}/`;

/** /cities/[citySlug]/ */
export const cityUrl = (citySlug: string): string =>
  `${SITE_BASE_URL}/cities/${citySlug}/`;

/** /search/ */
export const searchUrl = (): string => `${SITE_BASE_URL}/search/`;

/** /near-me/ */
export const nearMeUrl = (): string => `${SITE_BASE_URL}/near-me/`;

/** /about/ */
export const aboutUrl = (): string => `${SITE_BASE_URL}/about/`;

/** /contact/ */
export const contactUrl = (): string => `${SITE_BASE_URL}/contact/`;

/** /privacy/ */
export const privacyUrl = (): string => `${SITE_BASE_URL}/privacy/`;

/** /terms/ */
export const termsUrl = (): string => `${SITE_BASE_URL}/terms/`;

// ─── Slug/slug helpers ───────────────────────────────────────

/**
 * Convert a city name to its URL slug.
 * e.g. "Stoke-on-Trent" → "stoke-on-trent"
 */
export const toCitySlug = (city: string): string =>
  city.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/**
 * Convert a city slug back to a display-friendly title-cased name.
 * e.g. "stoke-on-trent" → "Stoke-on-Trent"
 */
export const fromCitySlug = (slug: string): string =>
  slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

// ─── Canonical enforcement ────────────────────────────────────

/**
 * Enforce canonical form:
 *  • https://
 *  • correct domain
 *  • trailing slash
 *  • lowercase path
 */
export const toCanonical = (path: string): string => {
  const clean = path
    .toLowerCase()
    .replace(/^https?:\/\/[^/]+/, '') // strip any existing domain
    .replace(/\/+/g, '/')             // collapse double slashes
    .replace(/\/?$/, '/');            // ensure trailing slash
  return `${SITE_BASE_URL}${clean}`;
};

/**
 * Returns the canonical URL for the current page path.
 * Use in generateMetadata: alternates.canonical = canonicalFor('/mosques/slug')
 */
export const canonicalFor = (path: string): string => toCanonical(path);

// ─── Sitemap URL ─────────────────────────────────────────────

export const sitemapUrl  = (file: string): string => `${SITE_BASE_URL}/${file}`;
export const robotsTxtUrl = (): string => `${SITE_BASE_URL}/robots.txt`;
