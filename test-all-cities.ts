import { getAllMosques } from './lib/data';

async function listAllCities() {
    const mosques = await getAllMosques();

    const cityCounts: Record<string, number> = {};
    mosques.forEach(m => {
        if (m.city && m.city !== 'Unknown' && m.city !== 'Unknown Area') {
            cityCounts[m.city] = (cityCounts[m.city] || 0) + 1;
        }
    });

    const sortedCities = Object.entries(cityCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 30);

    console.log('Top 30 cities in the data:\n');
    sortedCities.forEach(([city, count]) => {
        const slug = city.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        console.log(`${count.toString().padStart(4)} - ${city.padEnd(25)} -> ${slug}`);
    });
}

listAllCities();
