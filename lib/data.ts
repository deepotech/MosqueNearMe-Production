import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';
import { Mosque } from './types';
import {
    generateStableKey,
    lookupSlug,
    registerSlug,
    isSlugTaken,
    saveRegistry,
} from './slug-registry';

const DATA_FILE = path.join(process.cwd(), 'MosquesNov25Extended.csv');

// All 32 London boroughs plus City of London
const LONDON_BOROUGHS = new Set([
    'city of london',
    'city and county of the city of london',
    'barking and dagenham',
    'barnet',
    'bexley',
    'brent',
    'bromley',
    'camden',
    'croydon',
    'ealing',
    'enfield',
    'greenwich',
    'hackney',
    'hammersmith and fulham',
    'haringey',
    'harrow',
    'havering',
    'hillingdon',
    'hounslow',
    'islington',
    'kensington and chelsea',
    'kingston upon thames',
    'lambeth',
    'lewisham',
    'merton',
    'newham',
    'redbridge',
    'richmond upon thames',
    'southwark',
    'sutton',
    'tower hamlets',
    'waltham forest',
    'wandsworth',
    'westminster',
    'city of westminster',
]);

// Greater Manchester boroughs (excluding Manchester itself)
const GREATER_MANCHESTER_BOROUGHS = new Set([
    'bolton', 'bury', 'oldham', 'rochdale', 'stockport',
    'tameside', 'trafford', 'wigan', 'salford',
]);

// West Midlands boroughs (map to Birmingham)
const WEST_MIDLANDS_BOROUGHS = new Set([
    'sandwell', 'walsall', 'dudley', 'wolverhampton', 'solihull',
    'city of wolverhampton',
]);

// West Yorkshire districts (map to Leeds)
const WEST_YORKSHIRE_DISTRICTS = new Set([
    'kirklees', 'calderdale', 'wakefield',
]);

// South Yorkshire districts (map to Sheffield)
const SOUTH_YORKSHIRE_DISTRICTS = new Set([
    'rotherham', 'barnsley', 'doncaster',
]);

// City name mappings for normalization
const CITY_NAME_MAPPINGS: Record<string, string> = {
    // England - Major cities
    'city of leicester': 'Leicester',
    'city of nottingham': 'Nottingham',
    'city of bristol': 'Bristol',
    'city of derby': 'Derby',
    'city of stoke-on-trent': 'Stoke-on-Trent',
    'city of southampton': 'Southampton',
    'city of peterborough': 'Peterborough',
    'city of kingston upon hull': 'Hull',
    'city of portsmouth': 'Portsmouth',
    'city of wolverhampton': 'Wolverhampton',
    'city of brighton and hove': 'Brighton',
    'the city of brighton and hove': 'Brighton',

    // Scotland
    'city of edinburgh': 'Edinburgh',
    'glasgow city': 'Glasgow',
    'aberdeen city': 'Aberdeen',
    'dundee city': 'Dundee',

    // Wales
    'caerdydd - cardiff': 'Cardiff',
    'caerdydd': 'Cardiff',
    'city of cardiff': 'Cardiff',
    'casnewydd - newport': 'Newport',
    'abertawe - swansea': 'Swansea',

    // Other normalizations
    'blackburn with darwen': 'Blackburn',
    'newcastle upon tyne': 'Newcastle',
    'stoke-on-trent': 'Stoke-on-Trent',
    'stockton-on-tees': 'Stockton',
    'southend-on-sea': 'Southend',
};

export async function getAllMosques(): Promise<Mosque[]> {
    const fileContent = fs.readFileSync(DATA_FILE, 'utf8');

    const { data } = Papa.parse(fileContent, {
        header: false,
        skipEmptyLines: true,
    });

    const mosques: Mosque[] = [];

    // Track runtime-generated slugs to prevent collisions among NEW entries.
    // Existing slugs are already locked in the registry.
    const existingSlugs = new Set<string>();

    data.forEach((row: any, index: number) => {
        if (row.length < 4) return;

        const lng = parseFloat(row[0]);
        const lat = parseFloat(row[1]);
        const detailsRaw = row[2];
        const locationRaw = row[3];

        if (isNaN(lng) || isNaN(lat)) return;

        // Filter out invalid coordinates (outside UK/Ireland approx bounds)
        // Lat: 49.0 to 61.0, Lng: -11.0 to 2.0
        if (lat < 49.0 || lat > 61.0 || lng < -11.0 || lng > 2.0) return;

        // Parse details string based on the key: *[?600NoWBrel]Name
        // * or ? at start = location precision
        // ? inside brackets = info accuracy
        // Capacity: number
        // Women: W or NoW
        // Usage: J, NJ, Irreg
        // Multi: multi
        // Theme: Arab, Deob, Maud, Salf, Shia, Brel, Sufi
        // Management: Arab, Bang, Guje, Paki, Stud, Tami, Turk

        let locationPrecise = true;
        let infoVerified = true;
        let rawDetails = detailsRaw;

        // Fix reported typos in data
        rawDetails = rawDetails.replace(/Magid/g, 'Masjid');
        rawDetails = rawDetails.replace(/Vineschale/g, 'Wheelchair Accessible');
        rawDetails = rawDetails.replace(/Orchestral/g, 'Dedicated');
        rawDetails = rawDetails.replace(/Nearly/g, 'Nearby');

        // Check location precision
        if (rawDetails.startsWith('*')) {
            locationPrecise = true;
            rawDetails = rawDetails.substring(1);
        } else if (rawDetails.startsWith('?')) {
            locationPrecise = false;
            rawDetails = rawDetails.substring(1);
        }

        const detailsMatch = rawDetails.match(/^\[(.*?)\](.*)/);

        let capacity = 0;
        let ladies = false;
        let theme = "General";
        let management = "Unknown";
        let usage = "5 Times Daily";
        let isMultiFaith = false;
        let nameAddressPhone = rawDetails;

        if (detailsMatch) {
            let meta = detailsMatch[1];
            nameAddressPhone = detailsMatch[2];

            // Check info verification
            if (meta.startsWith('?')) {
                infoVerified = false;
                meta = meta.substring(1);
            }

            // Parse Capacity
            const capMatch = meta.match(/^(\d+)/);
            if (capMatch) {
                capacity = parseInt(capMatch[1]);
                meta = meta.replace(capMatch[0], '');
            }

            // Parse Women Facilities
            if (meta.includes('NoW')) {
                ladies = false;
                meta = meta.replace('NoW', '');
            } else if (meta.includes('W')) {
                ladies = true;
                meta = meta.replace('W', '');
            }

            // Parse Usage
            if (meta.includes('NJ')) {
                usage = "No Jumu'ah";
                meta = meta.replace('NJ', '');
            } else if (meta.includes('J')) {
                usage = "Jumu'ah Only";
                meta = meta.replace('J', '');
            } else if (meta.includes('Irreg')) {
                usage = "Irregular";
                meta = meta.replace('Irreg', '');
            }

            // Parse Multi-faith
            if (meta.includes('multi')) {
                isMultiFaith = true;
                meta = meta.replace('multi', '');
            }

            // Parse Management
            const mgmtMap: Record<string, string> = {
                'Arab': 'Arab', 'Bang': 'Bangladeshi', 'Guje': 'Gujerati',
                'Paki': 'Pakistani', 'Stud': 'Students', 'Tami': 'Tamil', 'Turk': 'Turkish'
            };
            for (const [code, full] of Object.entries(mgmtMap)) {
                if (meta.includes(code)) {
                    management = full;
                    meta = meta.replace(code, '');
                    break; // Assume one management type
                }
            }

            // Parse Theme (Remaining text is likely theme)
            // Clean up meta string
            let themeCode = meta.trim();
            const themeMap: Record<string, string> = {
                'Arab': 'Arab Mainstream', 'Deob': 'Deobandi', 'Maud': 'Jamaat-e-Islami',
                'Salf': 'Salafi', 'Shia': 'Shia', 'Brel': 'Barelvi', 'Sufi': 'Sufi'
            };

            // Try to find theme in remaining string
            for (const [code, full] of Object.entries(themeMap)) {
                if (themeCode.includes(code)) {
                    theme = full;
                    break;
                }
            }

            // Fallback if theme is still just the code or empty
            if (theme === "General" && themeCode.length > 1) {
                theme = themeMap[themeCode] || themeCode;
            }
        }

        const infoParts = nameAddressPhone.split('. ').map((s: string) => s.trim());
        const name = infoParts[0];

        let phone = "";
        let addressParts = infoParts.slice(1);

        const lastPart = infoParts[infoParts.length - 1];
        if (lastPart && (lastPart.match(/[\d\s]{10,}/) || lastPart.startsWith('0'))) {
            phone = lastPart;
            addressParts = infoParts.slice(1, infoParts.length - 1);
        }

        const fullAddress = addressParts.join(', ');

        const postcodeMatch = fullAddress.match(/([Gg][Ii][Rr] 0[Aa]{2})|((([A-Za-z][0-9]{1,2})|(([A-Za-z][A-Ha-hJ-Yy][0-9]{1,2})|(([A-Za-z][0-9][A-Za-z])|([A-Za-z][A-Ha-hJ-Yy][0-9][A-Za-z]?))))\s?[0-9][A-Za-z]{2})/);
        const postcode = postcodeMatch ? postcodeMatch[0] : "";

        let city = "Unknown";

        // Try to extract city from locationRaw (row[3]) first as it's cleaner
        // Format is usually: "District, City, Postcode-ID:X" or "City, Postcode-ID:X"
        if (locationRaw && locationRaw.length > 5) {
            // Remove the ID suffix
            const cleanLoc = locationRaw.replace(/-ID:\d+.*$/, '');
            const parts = cleanLoc.split(',').map((s: string) => s.trim()).filter((s: string) => s);

            if (parts.length > 1) {
                // Check for specific cities that appear in the second position
                const secondPart = parts[1].toLowerCase();
                const firstPart = parts[0].toLowerCase();

                // Check for city name mappings first (City of Leicester, Glasgow City, etc.)
                if (CITY_NAME_MAPPINGS[secondPart]) {
                    city = CITY_NAME_MAPPINGS[secondPart];
                } else if (CITY_NAME_MAPPINGS[firstPart]) {
                    // Also check first part for "City of X" format without district
                    city = CITY_NAME_MAPPINGS[firstPart];
                } else if (secondPart.includes('stoke-on-trent') || secondPart.includes('stoke on trent')) {
                    city = 'Stoke-on-Trent';
                } else if (secondPart === 'london' || LONDON_BOROUGHS.has(secondPart)) {
                    // Map London boroughs to "London" city
                    city = 'London';
                } else if (LONDON_BOROUGHS.has(firstPart)) {
                    // Also check first part for London boroughs
                    city = 'London';
                } else if (GREATER_MANCHESTER_BOROUGHS.has(secondPart) || GREATER_MANCHESTER_BOROUGHS.has(firstPart)) {
                    // Map Greater Manchester boroughs to "Manchester"
                    city = 'Manchester';
                } else if (WEST_MIDLANDS_BOROUGHS.has(secondPart) || WEST_MIDLANDS_BOROUGHS.has(firstPart)) {
                    // Map West Midlands boroughs to "Birmingham"
                    city = 'Birmingham';
                } else if (WEST_YORKSHIRE_DISTRICTS.has(secondPart) || WEST_YORKSHIRE_DISTRICTS.has(firstPart)) {
                    // Map West Yorkshire districts to "Leeds"
                    city = 'Leeds';
                } else if (SOUTH_YORKSHIRE_DISTRICTS.has(secondPart) || SOUTH_YORKSHIRE_DISTRICTS.has(firstPart)) {
                    // Map South Yorkshire districts to "Sheffield"
                    city = 'Sheffield';
                } else if (secondPart === 'birmingham') {
                    city = 'Birmingham';
                } else if (secondPart === 'manchester') {
                    city = 'Manchester';
                } else if (secondPart === 'leicester') {
                    city = 'Leicester';
                } else if (secondPart === 'leeds') {
                    city = 'Leeds';
                } else if (secondPart === 'sheffield') {
                    city = 'Sheffield';
                } else if (secondPart === 'bradford') {
                    city = 'Bradford';
                } else {
                    // Use the second part as city if it's not a postcode, otherwise use first part
                    const isSecondPartPostcode = /^[A-Za-z]{1,2}\d/.test(parts[1]);
                    city = isSecondPartPostcode ? parts[0] : parts[1];
                }
            } else if (parts.length === 1) {
                city = parts[0];
            }
        }

        // Fallback to address parsing if city is still Unknown or invalid
        if (city === "Unknown" || city.length < 2) {
            if (postcode) {
                const addressBeforePostcode = fullAddress.split(postcode)[0];
                const parts = addressBeforePostcode.split(',').map((s: string) => s.trim()).filter((s: string) => s);
                if (parts.length > 0) {
                    city = parts[parts.length - 1];
                }
            } else {
                const parts = fullAddress.split(',').map((s: string) => s.trim());
                if (parts.length > 0) city = parts[parts.length - 1];
            }
        }

        city = cleanCityName(city);

        // Final normalization: apply mappings to cleaned city name
        const cityLower = city.toLowerCase();
        if (CITY_NAME_MAPPINGS[cityLower]) {
            city = CITY_NAME_MAPPINGS[cityLower];
        } else if (LONDON_BOROUGHS.has(cityLower)) {
            city = 'London';
        } else if (GREATER_MANCHESTER_BOROUGHS.has(cityLower)) {
            city = 'Manchester';
        } else if (WEST_MIDLANDS_BOROUGHS.has(cityLower)) {
            city = 'Birmingham';
        } else if (WEST_YORKSHIRE_DISTRICTS.has(cityLower)) {
            city = 'Leeds';
        } else if (SOUTH_YORKSHIRE_DISTRICTS.has(cityLower)) {
            city = 'Sheffield';
        }

        // ── Slug Resolution (registry-first) ──────────────────────────
        // 1. Generate a stable content-based key for this mosque
        const stableKey = generateStableKey(name, postcode, lat, lng);

        // 2. Look up the permanently locked slug from the registry
        let slug = lookupSlug(stableKey);

        if (!slug) {
            // 3. New mosque – generate a fresh slug using the original algorithm
            let slugBase = `${name}-${city}-${postcode}`
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-|-$/g, '');
            slug = slugBase || `mosque-${index}`;

            // Ensure uniqueness against both registry slugs and runtime-generated ones
            let counter = 1;
            const originalSlug = slug;
            while (existingSlugs.has(slug) || isSlugTaken(slug)) {
                slug = `${originalSlug}-${counter}`;
                counter++;
            }

            // 4. Lock the new slug permanently
            registerSlug(stableKey, slug, name, city, postcode, lat, lng, 'new');
        }

        // Track all slugs seen this run to prevent runtime collisions
        existingSlugs.add(slug);

        let category = "Community Mosque";
        const lowerName = name.toLowerCase();
        if (lowerName.includes('jamia') || lowerName.includes('central') || capacity > 500) {
            category = "Purpose-built Mosque";
        } else if (lowerName.includes('centre') || lowerName.includes('center') || lowerName.includes('hall')) {
            category = "Converted Building";
        } else if (lowerName.includes('university') || lowerName.includes('student') || lowerName.includes('isoc')) {
            category = "University Prayer Room";
        } else if (lowerName.includes('hospital') || lowerName.includes('airport')) {
            category = "Public Prayer Room";
        }

        // Smart defaults for facilities based on mosque characteristics
        const isPurposeBuilt = category === "Purpose-built Mosque";
        const isLarge = capacity > 200;
        const isCommunity = category === "Community Mosque" || isPurposeBuilt;

        mosques.push({
            id: index.toString(),
            slug,
            name,
            address: fullAddress,
            postcode,
            city,
            phone,
            lat,
            lng,
            capacity,
            ladies,
            theme,
            category,
            management,
            usage,
            isMultiFaith,
            locationPrecise,
            infoVerified,
            facilities: {
                wudu: true, // All mosques have wudu facilities
                parking: isLarge || isPurposeBuilt, // Assume parking for larger/purpose-built mosques
                womenArea: ladies,
                wheelchairAccess: isPurposeBuilt, // Purpose-built mosques typically have wheelchair access
                jummahPrayer: usage !== "No Jumu'ah",
                dailyPrayers: usage === "5 Times Daily",
                airCon: false, // No data available yet
                library: false, // No data available yet
                childrenArea: false, // No data available yet
                janazah: false // No data available yet
            },
            openingHours: {
                alwaysOpen: isPurposeBuilt, // Purpose-built mosques typically always open
                hours: isPurposeBuilt ? undefined : "Prayer times only"
            },
            acceptsDonations: true,
            });
    });

    // Persist any newly registered slugs back to disk
    saveRegistry();

    return mosques;
}

export async function getMosqueBySlug(slug: string): Promise<Mosque | undefined> {
    const mosques = await getAllMosques();
    return mosques.find(m => m.slug === slug);
}

export async function getMosquesByCity(city: string): Promise<Mosque[]> {
    const mosques = await getAllMosques();
    return mosques.filter(m => m.city.toLowerCase() === city.toLowerCase());
}

export async function getMosquesNearLocation(lat: number, lng: number, limit: number = 5000): Promise<(Mosque & { distance: number })[]> {
    const mosques = await getAllMosques();

    return mosques
        .map(m => ({
            ...m,
            distance: getDistance(lat, lng, m.lat, m.lng)
        }))
        .sort((a: any, b: any) => a.distance - b.distance)
        .slice(0, limit);
}

export async function getNearbyMosques(lat: number, lng: number, limit: number = 5): Promise<Mosque[]> {
    const mosques = await getAllMosques();

    const uniqueMosques = new Map();
    mosques.forEach(m => {
        // Use name + city as a composite key to detect duplicates
        const key = `${m.name}-${m.city}`;
        if (!uniqueMosques.has(key)) {
            uniqueMosques.set(key, m);
        }
    });

    return Array.from(uniqueMosques.values())
        .map(m => ({
            ...m,
            distance: getDistance(lat, lng, m.lat, m.lng)
        }))
        .sort((a: any, b: any) => a.distance - b.distance)
        .filter((m: any) => m.distance > 0.1) // Filter out the mosque itself (distance ~ 0)
        .slice(0, limit);
}

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371;
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function deg2rad(deg: number) {
    return deg * (Math.PI / 180);
}

function cleanCityName(city: string): string {
    let cleaned = city.replace(/[\d]/g, '').trim();
    const lower = cleaned.toLowerCase();
    const invalid = ['not known', 'none', 'n/a', '+', 'unknown', '', 'none until'];

    if (invalid.includes(lower) || lower.startsWith('none until') || lower.length < 2) {
        return 'Unknown Area';
    }

    if (lower.startsWith('dewsbury')) {
        return 'Dewsbury';
    }

    // Capitalize first letter of each word
    return cleaned.replace(/\w\S*/g, (txt) => {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
}
