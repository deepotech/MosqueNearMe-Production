export interface Mosque {
    id: string;
    slug: string;
    name: string;
    address: string;
    postcode: string;
    city: string;
    phone: string;
    lat: number;
    lng: number;
    capacity: number;
    ladies: boolean;
    theme: string; // e.g. Arab, Pakistani, etc.
    category: string; // e.g. Purpose-built, Converted
    facilities: {
        wudu: boolean;
        parking: boolean;
        womenArea: boolean;
        wheelchairAccess: boolean;
        jummahPrayer: boolean;
        dailyPrayers: boolean;
        airCon: boolean;
        library: boolean;
        childrenArea: boolean;
        janazah: boolean;
    };
    openingHours: {
        alwaysOpen: boolean;
        hours?: string; // e.g., "5:00 AM - 11:00 PM"
    };
    management?: string; // e.g. Pakistani, Arab
    usage?: string; // e.g. Jumu'ah Only, 5 Times
    isMultiFaith?: boolean;
    locationPrecise?: boolean; // True if location is precise (*)
    infoVerified?: boolean; // True if info is verified (no ? in brackets)
    acceptsDonations?: boolean; // True if mosque is eligible for donations
}

export interface MapFilters {
    showAll: boolean;
    wudu: boolean;
    parking: boolean;
    womenArea: boolean;
    wheelchairAccess: boolean;
    jummahOnly: boolean;
    openNow: boolean;
    airCon: boolean;
    library: boolean;
    childrenArea: boolean;
    janazah: boolean;
}

export interface UserLocation {
    lat: number;
    lng: number;
    accuracy?: number;
}

export interface PrayerTimes {
    fajr: string;
    sunrise: string;
    dhuhr: string;
    asr: string;
    maghrib: string;
    isha: string;
    jummah?: string; // Only present on Fridays
    nextPrayer: string; // Name of the next prayer (e.g., "fajr", "dhuhr")
    currentPrayer?: string; // Name of current prayer if within prayer window
    timeUntilNext?: string; // Human-readable countdown (e.g., "2h 30m")
    isRamadan: boolean; // True if current date is in Ramadan
    isFriday: boolean; // True if current day is Friday
}
