import { getMosquesNearLocation } from './lib/data';

async function test() {
    console.log('Testing getMosquesNearLocation...');
    // Use a known location (e.g., Central London)
    const lat = 51.5074;
    const lng = -0.1278;

    try {
        const mosques = await getMosquesNearLocation(lat, lng, 5);
        console.log(`Found ${mosques.length} mosques near (${lat}, ${lng})`);

        mosques.forEach((m, i) => {
            console.log(`${i + 1}. ${m.name} - ${m.distance.toFixed(2)} km`);
        });

        if (mosques.length > 0 && mosques[0].distance < mosques[1].distance) {
            console.log('SUCCESS: Results are sorted by distance.');
        } else {
            console.log('WARNING: Results might not be sorted correctly.');
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

test();
