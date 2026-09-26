import { Coordinates, CalculationMethod, PrayerTimes as AdhanPrayerTimes, Prayer } from 'adhan';
import { PrayerTimes } from './types';

// Helper function to detect if current date is in Ramadan
function isRamadan(date: Date = new Date()): boolean {
    try {
        // Use Intl API to get Islamic calendar month
        const islamicDate = new Intl.DateTimeFormat('en-US-u-ca-islamic-umalqura', {
            month: 'numeric'
        }).format(date);

        // Month 9 is Ramadan in Islamic calendar
        return islamicDate === '9';
    } catch {
        return false;
    }
}

// Helper function to calculate time difference in human-readable format
function getTimeDifference(targetTime: Date): string {
    const now = new Date();
    const diffMs = targetTime.getTime() - now.getTime();

    if (diffMs < 0) return '';

    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
}

export function getPrayerTimes(lat: number, lng: number, date: Date = new Date()): PrayerTimes {
    const coordinates = new Coordinates(lat, lng);
    const params = CalculationMethod.MoonsightingCommittee();

    const prayerTimes = new AdhanPrayerTimes(coordinates, date, params);

    // Format times
    const formatter = new Intl.DateTimeFormat('en-GB', {
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
    });

    const fajrTime = prayerTimes.fajr;
    const sunriseTime = prayerTimes.sunrise;
    const dhuhrTime = prayerTimes.dhuhr;
    const asrTime = prayerTimes.asr;
    const maghribTime = prayerTimes.maghrib;
    const ishaTime = prayerTimes.isha;

    // Check if today is Friday
    const isFriday = date.getDay() === 5;

    // Calculate Jumu'ah time (on Fridays, typically same as Dhuhr but noted separately)
    const jummahTime = isFriday ? formatter.format(dhuhrTime) : undefined;

    // Determine next prayer
    const now = new Date();
    let nextPrayer: string = 'fajr';
    let nextPrayerTime: Date = fajrTime;
    let currentPrayer: string | undefined;

    const prayerSchedule = [
        { name: 'fajr', time: fajrTime },
        { name: 'sunrise', time: sunriseTime },
        { name: 'dhuhr', time: dhuhrTime },
        { name: 'asr', time: asrTime },
        { name: 'maghrib', time: maghribTime },
        { name: 'isha', time: ishaTime }
    ];

    // Find next prayer
    for (let i = 0; i < prayerSchedule.length; i++) {
        if (now < prayerSchedule[i].time) {
            nextPrayer = prayerSchedule[i].name;
            nextPrayerTime = prayerSchedule[i].time;
            break;
        }
    }

    // If all prayers have passed, next prayer is tomorrow's Fajr
    if (now >= ishaTime) {
        nextPrayer = 'fajr';
        const tomorrow = new Date(date);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowPrayerTimes = new AdhanPrayerTimes(coordinates, tomorrow, params);
        nextPrayerTime = tomorrowPrayerTimes.fajr;
    }

    // Calculate time until next prayer
    const timeUntilNext = getTimeDifference(nextPrayerTime);

    return {
        fajr: formatter.format(fajrTime),
        sunrise: formatter.format(sunriseTime),
        dhuhr: formatter.format(dhuhrTime),
        asr: formatter.format(asrTime),
        maghrib: formatter.format(maghribTime),
        isha: formatter.format(ishaTime),
        jummah: jummahTime,
        nextPrayer,
        currentPrayer,
        timeUntilNext,
        isRamadan: isRamadan(date),
        isFriday
    };
}

