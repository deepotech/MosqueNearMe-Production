import { getAllMosques } from './lib/data';

async function checkStoke() {
    const mosques = await getAllMosques();
    const stokeMosques = mosques.filter(m => m.city.toLowerCase().includes('stoke'));

    const cities = new Set(stokeMosques.map(m => m.city));
    console.log('Stoke variants found:', Array.from(cities));
}

checkStoke();
