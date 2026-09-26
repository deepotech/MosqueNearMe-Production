'use client';

import dynamic from 'next/dynamic';

const MosqueMap = dynamic(() => import('./MosqueMap'), {
    ssr: false,
    loading: () => <div style={{ height: '100%', width: '100%', background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading Map...</div>
});

export default function MosqueMapClient({ lat, lng, name }: { lat: number, lng: number, name: string }) {
    return <MosqueMap lat={lat} lng={lng} name={name} />;
}
