import { getAllMosques } from './lib/data';

async function testCities() {
    const mosques = await getAllMosques();

    // Find Dewsbury mosques
    const dewsburyMosques = mosques.filter(m =>
        m.city.toLowerCase().includes('dewsbury')
    );

    console.log('Dewsbury mosques found:', dewsburyMosques.length);
    console.log('Sample:', dewsburyMosques.slice(0, 3).map(m => ({
        name: m.name,
        city: m.city,
        slug: m.city.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    })));

    // Check all unique cities
    const cities = new Set<string>();
    mosques.forEach(m => {
        if (m.city && m.city !== 'Unknown') {
            cities.add(m.city);
        }
    });

    const cityArray = Array.from(cities).sort();
    console.log('\nTotal unique cities:', cityArray.length);
    console.log('Cities starting with D:', cityArray.filter(c => c.startsWith('D')));
}

testCities();
