import { getAllMosques } from './lib/data';

async function testStokeOnTrent() {
    const mosques = await getAllMosques();

    // Find all variations of Stoke
    const stokeVariations = mosques.filter(m =>
        m.city.toLowerCase().includes('stoke')
    );

    console.log('Mosques with "stoke" in city name:', stokeVariations.length);
    console.log('\nUnique city names with "stoke":');
    const uniqueCities = new Set(stokeVariations.map(m => m.city));
    uniqueCities.forEach(city => {
        const slug = city.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        console.log(`  "${city}" -> slug: "${slug}"`);
    });

    // Test the exact slug matching
    const citySlug = 'stoke-on-trent';
    const cityMosques = mosques.filter(m =>
        m.city.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') === citySlug
    );
    console.log(`\nMosques matching slug "${citySlug}":`, cityMosques.length);
    if (cityMosques.length > 0) {
        console.log('Sample mosques:', cityMosques.slice(0, 3).map(m => m.name));
    }
}

testStokeOnTrent();
