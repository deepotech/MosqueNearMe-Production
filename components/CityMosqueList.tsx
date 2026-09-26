'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Mosque } from '@/lib/types';

interface CityMosqueListProps {
    mosques: Mosque[];
    cityName: string;
}

const FACILITY_TAGS = [
    { key: 'wudu', emoji: '💧', label: 'Wudu' },
    { key: 'parking', emoji: '🅿️', label: 'Parking' },
    { key: 'womenArea', emoji: '🧕', label: "Women's Area" },
    { key: 'wheelchairAccess', emoji: '♿', label: 'Accessible' },
    { key: 'jummahPrayer', emoji: '🕌', label: "Jumu'ah" },
];

export default function CityMosqueList({ mosques, cityName }: CityMosqueListProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState<'All' | 'Jummah' | 'Ladies'>('All');

    const filteredMosques = useMemo(() => {
        return mosques.filter(m => {
            const matchesSearch =
                m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                m.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
                m.category.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesFilter =
                activeFilter === 'All' ? true :
                    activeFilter === 'Jummah' ? m.facilities.jummahPrayer :
                        activeFilter === 'Ladies' ? m.facilities.womenArea : true;

            return matchesSearch && matchesFilter;
        });
    }, [mosques, searchQuery, activeFilter]);

    const groupedMosques = useMemo(() => {
        const groups: Record<string, Mosque[]> = {};
        filteredMosques.forEach(m => {
            const firstLetter = m.name.charAt(0).toUpperCase();
            const key = /[A-Z]/.test(firstLetter) ? firstLetter : '#';
            if (!groups[key]) groups[key] = [];
            groups[key].push(m);
        });
        return groups;
    }, [filteredMosques]);

    const sortedGroups = Object.keys(groupedMosques).sort();
    const alphabet = '#ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

    const filterButtons = [
        { id: 'All', label: 'All Mosques', icon: '🕌' },
        { id: 'Jummah', label: "Jumu'ah Available", icon: '📅' },
        { id: 'Ladies', label: 'Ladies Facilities', icon: '🧕' },
    ];

    return (
        <div>
            {/* ===== Search & Filter Bar ===== */}
            <div style={{
                background: 'white',
                padding: '24px',
                borderRadius: '16px',
                border: '1px solid #e5e7eb',
                marginBottom: '28px',
                boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
            }}>
                {/* Search input */}
                <div style={{ position: 'relative', marginBottom: '16px' }}>
                    <span style={{
                        position: 'absolute', left: '14px', top: '50%',
                        transform: 'translateY(-50%)',
                        fontSize: '1.1rem', pointerEvents: 'none',
                    }}>
                        🔍
                    </span>
                    <input
                        type="text"
                        placeholder={`Search ${mosques.length} mosques in ${cityName}...`}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '13px 16px 13px 44px',
                            fontSize: '1rem',
                            border: '1.5px solid #e5e7eb',
                            borderRadius: '10px',
                            outline: 'none',
                            fontFamily: 'inherit',
                            transition: 'border-color 0.2s, box-shadow 0.2s',
                        }}
                        onFocus={e => {
                            e.target.style.borderColor = '#0f4c35';
                            e.target.style.boxShadow = '0 0 0 3px rgba(15,76,53,0.1)';
                        }}
                        onBlur={e => {
                            e.target.style.borderColor = '#e5e7eb';
                            e.target.style.boxShadow = 'none';
                        }}
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            style={{
                                position: 'absolute', right: '12px', top: '50%',
                                transform: 'translateY(-50%)',
                                background: '#f3f4f6', border: 'none',
                                borderRadius: '50%', width: '24px', height: '24px',
                                cursor: 'pointer', fontSize: '0.75rem',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: '#6b7280',
                            }}
                        >
                            ✕
                        </button>
                    )}
                </div>

                {/* Filter tabs */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {filterButtons.map(f => (
                        <button
                            key={f.id}
                            onClick={() => setActiveFilter(f.id as any)}
                            style={{
                                display: 'inline-flex', alignItems: 'center', gap: '6px',
                                padding: '9px 18px',
                                borderRadius: '99px',
                                border: activeFilter === f.id ? 'none' : '1.5px solid #e5e7eb',
                                cursor: 'pointer',
                                fontSize: '0.875rem',
                                fontWeight: '600',
                                fontFamily: 'inherit',
                                background: activeFilter === f.id
                                    ? 'linear-gradient(135deg, #0f4c35, #1a6b4a)'
                                    : 'white',
                                color: activeFilter === f.id ? 'white' : '#4b5563',
                                boxShadow: activeFilter === f.id
                                    ? '0 4px 12px rgba(15,76,53,0.25)'
                                    : 'none',
                                transition: 'all 0.2s',
                            }}
                        >
                            <span>{f.icon}</span>
                            {f.label}
                        </button>
                    ))}
                    <span style={{
                        marginLeft: 'auto', alignSelf: 'center',
                        fontSize: '0.875rem', color: '#9ca3af', fontWeight: '500',
                    }}>
                        {filteredMosques.length} result{filteredMosques.length !== 1 ? 's' : ''}
                    </span>
                </div>
            </div>

            {/* ===== A-Z Navigation ===== */}
            <div style={{
                display: 'flex', flexWrap: 'wrap', gap: '4px',
                marginBottom: '32px', justifyContent: 'center',
                background: 'white', padding: '12px 16px',
                borderRadius: '12px', border: '1px solid #e5e7eb',
                boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
            }}>
                {alphabet.map(letter => {
                    const hasMosques = groupedMosques[letter]?.length > 0;
                    return (
                        <a
                            key={letter}
                            href={hasMosques ? `#group-${letter}` : undefined}
                            style={{
                                width: '28px', height: '28px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '0.8rem', fontWeight: '700',
                                color: hasMosques ? '#0f4c35' : '#d1d5db',
                                cursor: hasMosques ? 'pointer' : 'default',
                                textDecoration: 'none',
                                borderRadius: '6px',
                                background: hasMosques ? 'rgba(15,76,53,0.08)' : 'transparent',
                                transition: 'all 0.15s',
                            }}
                        >
                            {letter}
                        </a>
                    );
                })}
            </div>

            {/* ===== Results ===== */}
            {filteredMosques.length === 0 ? (
                <div style={{
                    textAlign: 'center', padding: '60px 20px',
                    background: 'white', borderRadius: '16px',
                    border: '1px solid #e5e7eb',
                }}>
                    <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🔍</div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#111827', marginBottom: '8px' }}>
                        No mosques found
                    </h3>
                    <p style={{ color: '#6b7280', marginBottom: '20px' }}>
                        Try adjusting your search or filters.
                    </p>
                    <button
                        onClick={() => { setSearchQuery(''); setActiveFilter('All'); }}
                        style={{
                            background: '#0f4c35', color: 'white',
                            border: 'none', padding: '10px 24px',
                            borderRadius: '99px', fontWeight: '600',
                            cursor: 'pointer', fontFamily: 'inherit',
                            fontSize: '0.9rem',
                        }}
                    >
                        Clear Filters
                    </button>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
                    {sortedGroups.map(letter => (
                        <div key={letter} id={`group-${letter}`} style={{ scrollMarginTop: '20px' }}>
                            {/* Group header */}
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: '12px',
                                marginBottom: '16px', paddingBottom: '12px',
                                borderBottom: '2px solid #f3f4f6',
                            }}>
                                <span style={{
                                    width: '36px', height: '36px',
                                    background: 'linear-gradient(135deg, #0f4c35, #1a6b4a)',
                                    borderRadius: '10px', flexShrink: 0,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: 'white', fontSize: '1rem', fontWeight: '800',
                                    boxShadow: '0 4px 12px rgba(15,76,53,0.2)',
                                }}>
                                    {letter}
                                </span>
                                <span style={{ color: '#6b7280', fontSize: '0.875rem', fontWeight: '500' }}>
                                    {groupedMosques[letter].length} mosque{groupedMosques[letter].length !== 1 ? 's' : ''}
                                </span>
                            </div>

                            {/* Mosque Cards Grid */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                                gap: '16px',
                            }}>
                                {groupedMosques[letter].map(m => (
                                    <Link
                                        key={m.slug}
                                        href={`/mosques/${m.slug}`}
                                        style={{
                                            display: 'flex', flexDirection: 'column',
                                            background: 'white',
                                            borderRadius: '14px',
                                            border: '1px solid #e5e7eb',
                                            padding: '20px',
                                            textDecoration: 'none',
                                            transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
                                            boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
                                            position: 'relative',
                                            overflow: 'hidden',
                                        }}
                                        className="mosque-card"
                                    >
                                        {/* Left accent */}
                                        <div style={{
                                            position: 'absolute', left: 0, top: 0, bottom: 0,
                                            width: '4px',
                                            background: 'linear-gradient(180deg, #0f4c35, #2d8a61)',
                                        }} />

                                        <div style={{ paddingLeft: '8px' }}>
                                            <h3 style={{
                                                fontSize: '1rem', fontWeight: '700',
                                                color: '#111827', marginBottom: '6px',
                                                lineHeight: '1.35',
                                            }}>
                                                {m.name}
                                            </h3>
                                            <p style={{
                                                color: '#6b7280', fontSize: '0.85rem',
                                                marginBottom: '14px', lineHeight: '1.5',
                                            }}>
                                                📍 {m.address}
                                            </p>

                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
                                                <span style={{
                                                    display: 'inline-flex', alignItems: 'center',
                                                    padding: '3px 10px',
                                                    background: '#dbeafe', color: '#1e40af',
                                                    borderRadius: '99px', fontSize: '0.75rem', fontWeight: '600',
                                                }}>
                                                    {m.category}
                                                </span>
                                                {FACILITY_TAGS
                                                    .filter(t => m.facilities[t.key as keyof typeof m.facilities])
                                                    .slice(0, 4)
                                                    .map(t => (
                                                        <span key={t.key} title={t.label} style={{ fontSize: '1rem' }}>
                                                            {t.emoji}
                                                        </span>
                                                    ))
                                                }
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <style>{`
                .mosque-card:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 10px 28px rgba(15,76,53,0.12) !important;
                    border-color: rgba(15,76,53,0.2) !important;
                }
            `}</style>
        </div>
    );
}
