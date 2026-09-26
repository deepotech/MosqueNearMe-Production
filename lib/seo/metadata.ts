/**
 * lib/seo/metadata.ts
 * Centralized, reusable metadata builders for Next.js App Router.
 *
 * Usage:
 *   export async function generateMetadata() {
 *     return buildMosqueMetadata(mosque);
 *   }
 *
 * All metadata returned here uses the correct canonical domain,
 * consistent OpenGraph, Twitter, and robots directives.
 * Zero duplicate logic across pages.
 */

import type { Metadata } from 'next';
import { Mosque } from '../types';
import {
  SITE_NAME, DEFAULT_DESCRIPTION, DEFAULT_KEYWORDS,
  DEFAULT_OG_IMG, TWITTER_HANDLE, DEFAULT_ROBOTS, NOINDEX_ROBOTS,
} from './constants';
import { mosqueUrl, cityUrl, canonicalFor, homeUrl, searchUrl, nearMeUrl, toCitySlug } from './url';

// ─── Types ────────────────────────────────────────────────────
interface BaseMetaOptions {
  noindex?: boolean;
}

// ─── Shared helpers ───────────────────────────────────────────

function buildOpenGraph(title: string, description: string, url: string, imageUrl?: string): Metadata['openGraph'] {
  return {
    title,
    description,
    url,
    siteName: SITE_NAME,
    locale:   'en_GB',
    type:     'website',
    images:   [{ url: imageUrl ?? DEFAULT_OG_IMG, width: 1200, height: 630, alt: title }],
  };
}

function buildTwitter(title: string, description: string, imageUrl?: string): Metadata['twitter'] {
  return {
    card:        'summary_large_image',
    site:        TWITTER_HANDLE,
    title,
    description,
    images:      [imageUrl ?? DEFAULT_OG_IMG],
  };
}

// ─── Page-specific builders ───────────────────────────────────

/** Root layout / home page metadata */
export function buildHomeMetadata(): Metadata {
  const title = `${SITE_NAME} - Find Mosques & Prayer Times Across the UK`;
  const description = DEFAULT_DESCRIPTION;
  const url = homeUrl();
  return {
    title,
    description,
    keywords: DEFAULT_KEYWORDS,
    robots: DEFAULT_ROBOTS,
    alternates: { canonical: url },
    openGraph: buildOpenGraph(title, description, url),
    twitter:   buildTwitter(title, description),
  };
}

/** Individual mosque page metadata */
export function buildMosqueMetadata(mosque: Mosque, opts: BaseMetaOptions = {}): Metadata {
  const isUnknownCity = !mosque.city || mosque.city === 'Unknown' || mosque.city === 'Unknown Area';
  // Include address suffix to differentiate duplicate mosque names in same city
  const addressSuffix = mosque.address?.trim() ? `, ${mosque.address.trim()}` : '';
  const cityPart = isUnknownCity ? '' : `, ${mosque.city}`;
  const title = `${mosque.name}${addressSuffix}${cityPart} - Prayer Times & Directions | ${SITE_NAME}`;
  const description = mosque.address?.trim()
    ? `Find prayer times, facilities, and directions for ${mosque.name} at ${mosque.address}${isUnknownCity ? '' : ', ' + mosque.city}. View wudu facilities, parking, and women's areas.`
    : `Find prayer times, facilities, and directions for ${mosque.name}${isUnknownCity ? '' : ' in ' + mosque.city}. View wudu facilities, parking, and women's areas.`;
  const keywords = `${mosque.name}, ${mosque.city ?? ''} mosque, prayer times${mosque.city ? ' ' + mosque.city : ''}, mosque near me`;
  const url = mosqueUrl(mosque.slug);
  // Force noindex for mosques with no valid city — page lacks geographic context
  const shouldNoindex = opts.noindex || isUnknownCity;
  return {
    title,
    description,
    keywords,
    robots: shouldNoindex ? NOINDEX_ROBOTS : DEFAULT_ROBOTS,
    alternates: { canonical: shouldNoindex ? undefined : url },
    openGraph: shouldNoindex ? undefined : buildOpenGraph(title, description, url),
    twitter:   shouldNoindex ? undefined : buildTwitter(title, description),
  };
}

/** City listing page metadata */
export function buildCityMetadata(cityName: string, mosqueCount: number, opts: BaseMetaOptions = {}): Metadata {
  const citySlug = toCitySlug(cityName);
  const title = `Mosques in ${cityName} (${mosqueCount} found) - Prayer Times & Locations | ${SITE_NAME}`;
  const description = `Find all ${mosqueCount} mosques in ${cityName}. View prayer times, facilities, and directions to Islamic centres near you.`;
  const keywords = `mosques in ${cityName}, ${cityName} prayer times, islamic centres ${cityName}, mosque near me ${cityName}`;
  const url = cityUrl(citySlug);
  return {
    title,
    description,
    keywords,
    robots: opts.noindex ? NOINDEX_ROBOTS : DEFAULT_ROBOTS,
    alternates: { canonical: url },
    openGraph: buildOpenGraph(title, description, url),
    twitter:   buildTwitter(title, description),
  };
}

/** Search page metadata */
export function buildSearchMetadata(): Metadata {
  const title = `Search Mosques UK - Find by Name, City or Postcode | ${SITE_NAME}`;
  const description = 'Search for mosques across the UK by name, city or postcode. Find prayer times, facilities and directions.';
  const url = searchUrl();
  return {
    title,
    description,
    keywords: 'search mosque UK, find mosque, mosque finder',
    robots: DEFAULT_ROBOTS,
    alternates: { canonical: url },
    openGraph: buildOpenGraph(title, description, url),
    twitter:   buildTwitter(title, description),
  };
}

/** Near me page metadata */
export function buildNearMeMetadata(): Metadata {
  const title = `Mosque Near Me - Find Mosques by GPS Location | ${SITE_NAME}`;
  const description = 'Use your location to find the nearest mosque. Get directions, prayer times, and facility info.';
  const url = nearMeUrl();
  return {
    title,
    description,
    keywords: 'mosque near me, nearest mosque, local mosque, find mosque near me',
    robots: DEFAULT_ROBOTS,
    alternates: { canonical: url },
    openGraph: buildOpenGraph(title, description, url),
    twitter:   buildTwitter(title, description),
  };
}

/** Generic static page metadata */
export function buildStaticMetadata(
  title: string,
  description: string,
  path: string,
  opts: BaseMetaOptions = {},
): Metadata {
  const url = canonicalFor(path);
  return {
    title: `${title} | ${SITE_NAME}`,
    description,
    robots: opts.noindex ? NOINDEX_ROBOTS : DEFAULT_ROBOTS,
    alternates: { canonical: url },
    openGraph: buildOpenGraph(`${title} | ${SITE_NAME}`, description, url),
    twitter:   buildTwitter(`${title} | ${SITE_NAME}`, description),
  };
}

/** 404 page metadata — always noindex */
export function buildNotFoundMetadata(): Metadata {
  return {
    title: `Page Not Found | ${SITE_NAME}`,
    description: 'The page you are looking for could not be found.',
    robots: NOINDEX_ROBOTS,
  };
}
