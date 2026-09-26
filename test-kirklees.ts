import { getAllMosques } from './lib/data';

async function checkKirklees() {
    const mosques = await getAllMosques();

    // Find Kirklees mosques
    const kirkleesM = mosques.filter(m =>
        m.city.toLowerCase().includes('kirklees')
    );

    console.log('Mosques with "kirklees" in city name:', kirkleesM.length);

    if (kirkleesM.length > 0) {
        console.log('\nSample Kirklees mosques:');
        kirkleesM.slice(0, 5).forEach(m => {
            console.log(`  - ${m.name} (${m.city})`);
        });

        const slug = kirkleesM[0].city.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        console.log(`\nSlug for "${kirkleesM[0].city}": "${slug}"`);
    }
}

checkKirklees();
