'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import Link from 'next/link';
import { Mosque, UserLocation } from '@/lib/types';

// Icons moved inside component to ensure client-side creation

// Component to fit bounds when mosques or user location change
function FitBounds({ mosques, userLocation }: { mosques: (Mosque & { distance: number })[], userLocation: UserLocation | null }) {
    const map = useMap();

    useEffect(() => {
        if (mosques.length === 0 && !userLocation) return;

        const bounds = L.latLngBounds([]);

        // Add user location to bounds
        if (userLocation) {
            bounds.extend([userLocation.lat, userLocation.lng]);
        }

        // Add mosque locations to bounds
        mosques.forEach(mosque => {
            bounds.extend([mosque.lat, mosque.lng]);
        });

        if (bounds.isValid()) {
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
        }
    }, [mosques, userLocation, map]);

    return null;
}

interface NearMeMapProps {
    mosques: (Mosque & { distance: number })[];
    userLocation: UserLocation | null;
    center?: [number, number];
    zoom?: number;
}

export default function NearMeMap({ mosques, userLocation, center, zoom = 13 }: NearMeMapProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const mosqueIcon = L.icon({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });

    const userLocationIcon = L.divIcon({
        className: 'user-location-marker',
        html: `<div style="
            width: 20px; 
            height: 20px; 
            background: #2563eb; 
            border: 3px solid white; 
            border-radius: 50%;
            box-shadow: 0 0 10px rgba(37, 99, 235, 0.5);
        "></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
    });

    if (!mounted || typeof window === 'undefined') {
        return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', background: '#f0f0f0' }}>Loading map...</div>;
    }

    // Determine map center
    const mapCenter: [number, number] = center ||
        (userLocation ? [userLocation.lat, userLocation.lng] :
            [54.5, -4.0]); // UK center

    return (
        <MapContainer
            center={mapCenter}
            zoom={userLocation ? 12 : 6}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={true}
        >
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />

            <FitBounds mosques={mosques} userLocation={userLocation} />

            {/* User location marker */}
            {userLocation && (
                <Marker
                    position={[userLocation.lat, userLocation.lng]}
                    icon={userLocationIcon}
                >
                    <Popup>
                        <strong>Your Location</strong>
                        {userLocation.accuracy && (
                            <p style={{ margin: '5px 0 0 0', fontSize: '0.85rem', color: '#666' }}>
                                Accuracy: ±{Math.round(userLocation.accuracy)}m
                            </p>
                        )}
                    </Popup>
                </Marker>
            )}

            {/* Mosque markers */}
            {mosques.map((mosque) => (
                <Marker
                    key={mosque.id}
                    position={[mosque.lat, mosque.lng]}
                    icon={mosqueIcon}
                >
                    <Popup>
                        <div style={{ minWidth: '200px' }}>
                            <h3 style={{ margin: '0 0 8px 0', fontSize: '1rem', color: 'var(--primary-color)' }}>
                                {mosque.name}
                            </h3>
                            <p style={{ margin: '0 0 5px 0', fontSize: '0.85rem', color: '#666' }}>
                                {mosque.address}
                            </p>
                            {userLocation && typeof mosque.distance === 'number' && (
                                <p style={{ margin: '5px 0', fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--secondary-color)' }}>
                                    📍 {mosque.distance.toFixed(2)} km away
                                </p>
                            )}

                            {/* Facility badges */}
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '8px' }}>
                                {mosque.facilities.womenArea && (
                                    <span style={{
                                        background: '#e0f2fe',
                                        color: '#075985',
                                        padding: '2px 6px',
                                        borderRadius: '4px',
                                        fontSize: '0.75rem'
                                    }}>
                                        👩 Women Area
                                    </span>
                                )}
                                {mosque.facilities.parking && (
                                    <span style={{
                                        background: '#dbeafe',
                                        color: '#1e40af',
                                        padding: '2px 6px',
                                        borderRadius: '4px',
                                        fontSize: '0.75rem'
                                    }}>
                                        🅿️ Parking
                                    </span>
                                )}
                                {mosque.facilities.wheelchairAccess && (
                                    <span style={{
                                        background: '#dcfce7',
                                        color: '#166534',
                                        padding: '2px 6px',
                                        borderRadius: '4px',
                                        fontSize: '0.75rem'
                                    }}>
                                        ♿ Accessible
                                    </span>
                                )}
                            </div>

                            <Link
                                href={`/mosques/${mosque.slug}`}
                                style={{
                                    display: 'inline-block',
                                    marginTop: '10px',
                                    padding: '6px 12px',
                                    background: 'var(--secondary-color)',
                                    color: 'white',
                                    borderRadius: '4px',
                                    textDecoration: 'none',
                                    fontSize: '0.85rem',
                                    fontWeight: '500'
                                }}
                            >
                                View Details →
                            </Link>
                        </div>
                    </Popup>
                </Marker>
            ))}
        </MapContainer>
    );
}
