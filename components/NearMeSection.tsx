'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useGeolocation } from '@/hooks/useGeolocation';
import FilterPanel from '@/components/FilterPanel';
import { Mosque, MapFilters } from '@/lib/types';

const NearMeMap = dynamic(() => import('@/components/NearMeMap'), {
    ssr: false,
    loading: () => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', background: '#f0f4ef', flexDirection: 'column', gap: '12px' }}>
            <div style={{ width: '36px', height: '36px', border: '3px solid #e5e7eb', borderTop: '3px solid #0f4c35', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>Loading map...</p>
            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
    )
});

export default function NearMeSection() {
    const { location, loading, error, permissionDenied, requestLocation } = useGeolocation(true);
    const [mosques, setMosques] = useState<(Mosque & { distance: number })[]>([]);
    const [filteredMosques, setFilteredMosques] = useState<(Mosque & { distance: number })[]>([]);
    const [loadingMosques, setLoadingMosques] = useState(true);
    const [filters, setFilters] = useState<MapFilters>({
        showAll: true, wudu: false, parking: false, womenArea: false,
        wheelchairAccess: false, jummahOnly: false, openNow: false,
        airCon: false, library: false, childrenArea: false, janazah: false
    });

    useEffect(() => {
        setLoadingMosques(true);
        fetch('/mosques.json')
            .then(res => res.json())
            .then(data => { setMosques(data); setFilteredMosques(data); setLoadingMosques(false); })
            .catch(err => { console.error('Failed to fetch mosques:', err); setLoadingMosques(false); });
    }, [location]);

    useEffect(() => {
        let filtered = mosques;
        if (filters.wudu) filtered = filtered.filter(m => m.facilities.wudu);
        if (filters.parking) filtered = filtered.filter(m => m.facilities.parking);
        if (filters.womenArea) filtered = filtered.filter(m => m.facilities.womenArea);
        if (filters.wheelchairAccess) filtered = filtered.filter(m => m.facilities.wheelchairAccess);
        if (filters.jummahOnly) filtered = filtered.filter(m => m.facilities.jummahPrayer);
        if (filters.openNow) filtered = filtered.filter(m => m.openingHours.alwaysOpen);
        if (filters.airCon) filtered = filtered.filter(m => m.facilities.airCon);
        if (filters.library) filtered = filtered.filter(m => m.facilities.library);
        if (filters.childrenArea) filtered = filtered.filter(m => m.facilities.childrenArea);
        if (filters.janazah) filtered = filtered.filter(m => m.facilities.janazah);
        setFilteredMosques(filters.showAll ? filtered : filtered.slice(0, 50));
    }, [filters, mosques, location]);

    return (
        <div id="near-me" style={{ background: 'white', padding: '70px 0', scrollMarginTop: '20px' }}>
            <div className="container">

                {/* Section header */}
                <div style={{ textAlign: 'center', marginBottom: '36px' }}>
                    <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '6px',
                        background: 'rgba(15,76,53,0.08)', color: '#0f4c35',
                        padding: '6px 16px', borderRadius: '99px',
                        fontSize: '0.82rem', fontWeight: '700', letterSpacing: '0.05em',
                        textTransform: 'uppercase', marginBottom: '14px',
                    }}>
                        📍 GPS-Powered
                    </span>
                    <h2 style={{ fontSize: 'clamp(1.8rem,4vw,2.8rem)', fontWeight: '800', color: '#111827', marginBottom: '10px', letterSpacing: '-0.02em' }}>
                        Mosques Near You
                    </h2>
                    <p style={{ color: '#6b7280', fontSize: '1rem', maxWidth: '420px', margin: '0 auto' }}>
                        {location ? 'Showing mosques closest to your location' : 'Enable location to see nearby mosques on the map'}
                    </p>
                </div>

                {/* Location permission banner */}
                {!loading && !location && (
                    <div style={{
                        background: permissionDenied
                            ? 'linear-gradient(135deg, #fef2f2, #fee2e2)'
                            : 'linear-gradient(135deg, #eff6ff, #dbeafe)',
                        padding: '20px 24px',
                        textAlign: 'center',
                        borderRadius: '14px',
                        marginBottom: '24px',
                        border: permissionDenied ? '1px solid #fca5a5' : '1px solid #93c5fd',
                    }}>
                        {permissionDenied ? (
                            <>
                                <p style={{ margin: '0 0 6px', color: '#991b1b', fontWeight: '600', fontSize: '1rem' }}>
                                    📍 Location access denied — showing all UK mosques
                                </p>
                                <p style={{ margin: 0, fontSize: '0.85rem', color: '#7f1d1d' }}>
                                    To see nearby mosques, enable location in your browser settings and refresh.
                                </p>
                            </>
                        ) : (
                            <>
                                <p style={{ margin: '0 0 14px', color: '#1e40af', fontWeight: '600', fontSize: '1rem' }}>
                                    📍 Enable location to find the closest mosques to you
                                </p>
                                <button
                                    onClick={requestLocation}
                                    style={{
                                        background: 'linear-gradient(135deg, #0f4c35, #1a6b4a)',
                                        color: 'white', border: 'none',
                                        padding: '10px 24px', borderRadius: '99px',
                                        fontSize: '0.9rem', fontWeight: '700',
                                        cursor: 'pointer', fontFamily: 'inherit',
                                        boxShadow: '0 4px 16px rgba(15,76,53,0.25)',
                                    }}
                                >
                                    Allow Location Access
                                </button>
                            </>
                        )}
                    </div>
                )}

                {/* Loading spinner */}
                {(loading || loadingMosques) && (
                    <div style={{
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center',
                        padding: '80px 20px', gap: '16px',
                    }}>
                        <div style={{
                            width: '52px', height: '52px',
                            border: '4px solid #e5e7eb',
                            borderTop: '4px solid #0f4c35',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite',
                        }} />
                        <p style={{ fontSize: '1rem', color: '#6b7280', fontWeight: '500' }}>
                            {loading ? 'Getting your location...' : 'Loading mosques...'}
                        </p>
                        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
                    </div>
                )}

                {/* Main content: filter + map */}
                {!loading && !loadingMosques && (
                    <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                        {/* Filter Panel */}
                        <div style={{ flex: '0 0 300px', minWidth: '280px' }}>
                            <FilterPanel
                                filters={filters}
                                onFilterChange={setFilters}
                                mosqueCount={filteredMosques.length}
                            />
                        </div>

                        {/* Map */}
                        <div style={{
                            flex: '1', minWidth: '400px', height: '580px',
                            borderRadius: '16px', overflow: 'hidden',
                            boxShadow: '0 8px 30px rgba(0,0,0,0.1)',
                            border: '1px solid #e5e7eb',
                        }}>
                            <NearMeMap mosques={filteredMosques} userLocation={location} />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
