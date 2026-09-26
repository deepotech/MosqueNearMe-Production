'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useGeolocation } from '@/hooks/useGeolocation';
import FilterPanel from '@/components/FilterPanel';
import { Mosque, MapFilters } from '@/lib/types';

// Dynamically import map to avoid SSR issues
const NearMeMap = dynamic(() => import('@/components/NearMeMap'), {
    ssr: false,
    loading: () => <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', background: '#f0f0f0' }}>Loading map...</div>
});

export default function NearMePage() {
    const { location, loading, error, permissionDenied, requestLocation } = useGeolocation(true);
    const [mosques, setMosques] = useState<(Mosque & { distance: number })[]>([]);
    const [filteredMosques, setFilteredMosques] = useState<(Mosque & { distance: number })[]>([]);
    const [loadingMosques, setLoadingMosques] = useState(true);
    const [filters, setFilters] = useState<MapFilters>({
        showAll: true,
        wudu: false,
        parking: false,
        womenArea: false,
        wheelchairAccess: false,
        jummahOnly: false,
        openNow: false,
        airCon: false,
        library: false,
        childrenArea: false,
        janazah: false
    });

    // Fetch mosques based on location
    useEffect(() => {
        setLoadingMosques(true);

        let url = '/mosques.json';

        // Note: In static export, we can't pass query params to the server.
        // We fetch all mosques and filter by distance on the client if needed.
        // The API logic previously did some filtering, but now we get the full list.

        fetch(url)
            .then(res => res.json())
            .then(data => {
                setMosques(data);
                setFilteredMosques(data); // API now limits to 50 nearby, or returns all if no location
                setLoadingMosques(false);
            })
            .catch(err => {
                console.error('Failed to fetch mosques:', err);
                setLoadingMosques(false);
            });
    }, [location]);

    // Apply filters
    useEffect(() => {
        let filtered = mosques;

        if (filters.wudu) {
            filtered = filtered.filter(m => m.facilities.wudu);
        }
        if (filters.parking) {
            filtered = filtered.filter(m => m.facilities.parking);
        }
        if (filters.womenArea) {
            filtered = filtered.filter(m => m.facilities.womenArea);
        }
        if (filters.wheelchairAccess) {
            filtered = filtered.filter(m => m.facilities.wheelchairAccess);
        }
        if (filters.jummahOnly) {
            filtered = filtered.filter(m => m.facilities.jummahPrayer);
        }
        if (filters.openNow) {
            filtered = filtered.filter(m => m.openingHours.alwaysOpen);
        }

        // If we have location, the list is already sorted and limited by API (mostly).
        // But if we filter, we might reduce the list size.
        // If no location, we have all mosques, so we definitely need to limit.

        if (filters.showAll && location) {
            setFilteredMosques(filtered);
        } else {
            setFilteredMosques(filtered.slice(0, 50));
        }
    }, [filters, mosques, location]);



    return (
        <div style={{ minHeight: '100vh', background: '#f8f9fa' }}>
            {/* Header */}
            <header style={{ background: 'var(--primary-color)', color: 'white', padding: '20px 0', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1 style={{ fontSize: '1.8rem', margin: '0 0 5px 0' }}>🕌 Mosques Near Me</h1>
                        <p style={{ margin: 0, opacity: 0.9, fontSize: '0.95rem' }}>
                            {location ? 'Showing mosques closest to your location' : 'Enable location to see nearby mosques'}
                        </p>
                    </div>
                    <Link href="/" style={{ color: 'white', textDecoration: 'none', fontSize: '0.9rem', fontWeight: '500' }}>
                        ← Back to Home
                    </Link>
                </div>
            </header>

            {/* Location Permission Banner */}
            {!loading && !location && (
                <div style={{
                    background: permissionDenied ? '#fee2e2' : '#dbeafe',
                    padding: '15px 20px',
                    textAlign: 'center',
                    borderBottom: '1px solid #e5e7eb'
                }}>
                    <div className="container">
                        {permissionDenied ? (
                            <>
                                <p style={{ margin: '0 0 10px 0', color: '#991b1b', fontWeight: '500' }}>
                                    📍 Location access denied. Showing all UK mosques.
                                </p>
                                <p style={{ margin: 0, fontSize: '0.85rem', color: '#7f1d1d' }}>
                                    To see nearby mosques, enable location in your browser settings and refresh the page.
                                </p>
                            </>
                        ) : (
                            <>
                                <p style={{ margin: '0 0 10px 0', color: '#1e40af', fontWeight: '500' }}>
                                    📍 Enable location to find mosques nearest to you
                                </p>
                                <button
                                    onClick={requestLocation}
                                    style={{
                                        background: 'var(--secondary-color)',
                                        color: 'white',
                                        border: 'none',
                                        padding: '8px 20px',
                                        borderRadius: '6px',
                                        fontSize: '0.9rem',
                                        fontWeight: '500',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Allow Location Access
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Loading State */}
            {(loading || loadingMosques) && (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '60px 20px',
                    gap: '15px'
                }}>
                    <div style={{
                        width: '50px',
                        height: '50px',
                        border: '4px solid #e5e7eb',
                        borderTop: '4px solid var(--secondary-color)',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                    }} />
                    <p style={{ fontSize: '1.1rem', color: '#666' }}>
                        {loading ? 'Getting your location...' : 'Loading mosques...'}
                    </p>
                    <style>{`
                        @keyframes spin {
                            0% { transform: rotate(0deg); }
                            100% { transform: rotate(360deg); }
                        }
                    `}</style>
                </div>
            )}

            {/* Main Content */}
            {!loading && !loadingMosques && (
                <div className="container" style={{ padding: '20px', display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                    {/* Filter Panel */}
                    <div style={{
                        flex: '0 0 300px',
                        minWidth: '280px'
                    }}>
                        <FilterPanel
                            filters={filters}
                            onFilterChange={setFilters}
                            mosqueCount={filteredMosques.length}
                        />
                    </div>

                    {/* Map */}
                    <div style={{
                        flex: '1',
                        minWidth: '400px',
                        height: '70vh',
                        minHeight: '500px',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }}>
                        <NearMeMap
                            mosques={filteredMosques}
                            userLocation={location}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
