'use client';

import React from 'react';
import { MapFilters } from '@/lib/types';

interface FilterPanelProps {
    filters: MapFilters;
    onFilterChange: (filters: MapFilters) => void;
    mosqueCount: number;
}

const FILTER_ITEMS = [
    { key: 'wudu', label: 'Wudu Facilities', icon: '💧', desc: 'Ablution facilities' },
    { key: 'parking', label: 'Parking', icon: '🅿️', desc: 'On-site parking' },
    { key: 'womenArea', label: "Women's Area", icon: '🧕', desc: "Dedicated space" },
    { key: 'wheelchairAccess', label: 'Wheelchair Access', icon: '♿', desc: 'Accessible entry' },
    { key: 'jummahOnly', label: "Jumu'ah Prayers", icon: '🕌', desc: 'Friday prayers' },
    { key: 'openNow', label: 'Always Open', icon: '🕐', desc: '24/7 access' },
    { key: 'airCon', label: 'Air Conditioning', icon: '❄️', desc: 'Climate controlled' },
    { key: 'library', label: 'Library', icon: '📚', desc: 'Islamic library' },
    { key: 'childrenArea', label: "Children's Area", icon: '🧸', desc: 'Space for children' },
    { key: 'janazah', label: 'Janazah Facilities', icon: '🤲', desc: 'Funeral services' },
] as const;

export default function FilterPanel({ filters, onFilterChange, mosqueCount }: FilterPanelProps) {
    const handleToggle = (filterKey: keyof MapFilters) => {
        if (filterKey === 'showAll') {
            onFilterChange({
                showAll: true, wudu: false, parking: false, womenArea: false,
                wheelchairAccess: false, jummahOnly: false, openNow: false,
                airCon: false, library: false, childrenArea: false, janazah: false
            });
        } else {
            onFilterChange({ ...filters, showAll: false, [filterKey]: !filters[filterKey] });
        }
    };

    const activeCount = Object.entries(filters)
        .filter(([key, val]) => key !== 'showAll' && val === true).length;

    return (
        <div style={{
            background: 'white',
            borderRadius: '16px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
            overflow: 'hidden',
        }}>
            {/* Header */}
            <div style={{
                padding: '16px 20px',
                background: 'linear-gradient(90deg, #0f4c35, #1a6b4a)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1rem' }}>🎛️</span>
                    <h2 style={{ color: 'white', fontSize: '1rem', fontWeight: '700', margin: 0 }}>
                        Filter Mosques
                    </h2>
                </div>
                {activeCount > 0 && (
                    <span style={{
                        background: '#c8a84b', color: 'white',
                        padding: '3px 10px', borderRadius: '99px',
                        fontSize: '0.78rem', fontWeight: '700',
                    }}>
                        {activeCount} active
                    </span>
                )}
            </div>

            <div style={{ padding: '16px' }}>
                {/* Count bar */}
                <div style={{
                    background: '#f0fdf4', borderRadius: '10px',
                    padding: '12px 16px', marginBottom: '14px',
                    display: 'flex', alignItems: 'center', gap: '8px',
                    border: '1px solid #bbf7d0',
                }}>
                    <span style={{ fontSize: '1.2rem' }}>🕌</span>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#065f46', fontWeight: '600' }}>
                        Showing <strong>{mosqueCount}</strong> mosque{mosqueCount !== 1 ? 's' : ''}
                    </p>
                </div>

                {/* Show All reset */}
                <button
                    onClick={() => handleToggle('showAll')}
                    style={{
                        width: '100%', padding: '10px 14px',
                        background: filters.showAll ? 'linear-gradient(135deg, #0f4c35, #1a6b4a)' : '#f9fafb',
                        color: filters.showAll ? 'white' : '#374151',
                        border: filters.showAll ? 'none' : '1.5px solid #e5e7eb',
                        borderRadius: '10px', cursor: 'pointer',
                        fontFamily: 'inherit', fontSize: '0.875rem', fontWeight: '600',
                        display: 'flex', alignItems: 'center', gap: '8px',
                        transition: 'all 0.2s', marginBottom: '12px',
                        boxShadow: filters.showAll ? '0 4px 12px rgba(15,76,53,0.2)' : 'none',
                    }}
                >
                    <span>🔄</span> Show All Mosques
                </button>

                {/* Divider */}
                <div style={{ height: '1px', background: '#f3f4f6', margin: '4px 0 12px' }} />

                {/* Filter toggles */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {FILTER_ITEMS.map(({ key, label, icon, desc }) => {
                        const isChecked = filters[key as keyof MapFilters] as boolean;
                        return (
                            <div
                                key={key}
                                onClick={() => handleToggle(key as keyof MapFilters)}
                                style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    padding: '11px 14px', borderRadius: '10px', cursor: 'pointer',
                                    background: isChecked ? '#f0fdf4' : '#f9fafb',
                                    border: `1.5px solid ${isChecked ? '#86efac' : '#f3f4f6'}`,
                                    transition: 'all 0.18s',
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>{icon}</span>
                                    <div>
                                        <div style={{ fontSize: '0.875rem', fontWeight: isChecked ? '700' : '500', color: isChecked ? '#065f46' : '#374151' }}>
                                            {label}
                                        </div>
                                        <div style={{ fontSize: '0.72rem', color: '#9ca3af', marginTop: '1px' }}>{desc}</div>
                                    </div>
                                </div>

                                {/* Toggle pill */}
                                <div style={{
                                    width: '40px', height: '22px', flexShrink: 0,
                                    background: isChecked ? '#0f4c35' : '#d1d5db',
                                    borderRadius: '99px', position: 'relative',
                                    transition: 'background 0.2s',
                                }}>
                                    <div style={{
                                        width: '16px', height: '16px',
                                        background: 'white', borderRadius: '50%',
                                        position: 'absolute', top: '3px',
                                        left: isChecked ? '21px' : '3px',
                                        transition: 'left 0.2s',
                                        boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                                    }} />
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Note */}
                <div style={{
                    marginTop: '14px', padding: '10px 12px',
                    background: '#fffbeb', borderRadius: '8px',
                    border: '1px solid #fde68a',
                    fontSize: '0.75rem', color: '#92400e', lineHeight: '1.5',
                }}>
                    <strong>Note:</strong> Facility info is based on available data. Please verify with each mosque.
                </div>
            </div>
        </div>
    );
}
