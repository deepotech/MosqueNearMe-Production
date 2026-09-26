import { getAllMosques } from './lib/data';

async function countDewsbury() {
    const mosques = await getAllMosques();

    // Count exact matches
    const exactDewsbury = mosques.filter(m => m.city === 'Dewsbury');
    console.log('Exact "Dewsbury" matches:', exactDewsbury.length);

    // Count case-insensitive matches
    const dewsburyLower = mosques.filter(m => m.city.toLowerCase() === 'dewsbury');
    console.log('Case-insensitive "dewsbury" matches:', dewsburyLower.length);

    // Count all variations
    const allDewsbury = mosques.filter(m => m.city.toLowerCase().includes('dewsbury'));
    console.log('All with "dewsbury" in name:', allDewsbury.length);

    // Show unique city names with Dewsbury
    const uniqueCities = new Set(allDewsbury.map(m => m.city));
    console.log('\nUnique city names:');
    uniqueCities.forEach(city => {
        const count = allDewsbury.filter(m => m.city === city).length;
        console.log(`  ${city}: ${count}`);
    });
}

countDewsbury();
