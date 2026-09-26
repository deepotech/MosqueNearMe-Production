import { getAllMosques } from './lib/data';

async function testDewsbury() {
    const mosques = await getAllMosques();

    // Find all variations of Dewsbury
    const dewsburyVariations = mosques.filter(m =>
        m.city.toLowerCase().includes('dewsbury')
    );

    console.log('Mosques with "dewsbury" in city name:', dewsburyVariations.length);
    console.log('\nUnique city names with "dewsbury":');
    const uniqueCities = new Set(dewsburyVariations.map(m => m.city));
    uniqueCities.forEach(city => {
        const slug = city.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        const count = dewsburyVariations.filter(m => m.city === city).length;
        console.log(`  "${city}" (${count} mosques) -> slug: "${slug}"`);
    });

    // Test the exact slug matching
    const citySlug = 'dewsbury';
    const cityMosques = mosques.filter(m =>
        m.city.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') === citySlug
    );
    console.log(`\nMosques matching slug "${citySlug}":`, cityMosques.length);
    if (cityMosques.length > 0) {
        console.log('Sample mosques:', cityMosques.slice(0, 3).map(m => ({ name: m.name, city: m.city })));
    }
}

testDewsbury();
