'use client';

import { useState, useEffect } from 'react';

export interface UserLocation {
    lat: number;
    lng: number;
    accuracy?: number;
}

export interface GeolocationState {
    location: UserLocation | null;
    loading: boolean;
    error: string | null;
    permissionDenied: boolean;
}

export function useGeolocation(requestOnMount: boolean = false) {
    const [state, setState] = useState<GeolocationState>({
        location: null,
        loading: false,
        error: null,
        permissionDenied: false
    });

    const requestLocation = () => {
        // Check if geolocation is supported
        if (!navigator.geolocation) {
            setState(prev => ({
                ...prev,
                loading: false,
                error: 'Geolocation is not supported by your browser'
            }));
            return;
        }

        setState(prev => ({ ...prev, loading: true, error: null }));

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setState({
                    location: {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                        accuracy: position.coords.accuracy
                    },
                    loading: false,
                    error: null,
                    permissionDenied: false
                });
            },
            (error) => {
                let errorMessage = 'Failed to get your location';
                let permissionDenied = false;

                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage = 'Location permission denied. Please enable location access to find mosques near you.';
                        permissionDenied = true;
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = 'Location information is unavailable.';
                        break;
                    case error.TIMEOUT:
                        errorMessage = 'Location request timed out.';
                        break;
                    default:
                        errorMessage = 'An unknown error occurred while getting your location.';
                }

                setState({
                    location: null,
                    loading: false,
                    error: errorMessage,
                    permissionDenied
                });
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 300000 // Cache position for 5 minutes
            }
        );
    };

    useEffect(() => {
        if (requestOnMount) {
            requestLocation();
        }
    }, [requestOnMount]);

    return {
        ...state,
        requestLocation
    };
}
