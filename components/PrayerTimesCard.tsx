'use client';

import React from 'react';
import { PrayerTimes } from '@/lib/types';

interface PrayerTimesCardProps {
    prayerTimes: PrayerTimes;
    mosqueName?: string;
}

const PrayerTimesCard: React.FC<PrayerTimesCardProps> = ({ prayerTimes, mosqueName }) => {
    const {
        fajr,
        sunrise,
        dhuhr,
        asr,
        maghrib,
        isha,
        jummah,
        nextPrayer,
        timeUntilNext,
        isRamadan,
        isFriday
    } = prayerTimes;

    // Prayer rows (excluding sunrise which is for reference)
    const prayers = [
        { name: 'Fajr', time: fajr, key: 'fajr' },
        { name: 'Sunrise', time: sunrise, key: 'sunrise', isReference: true },
        { name: 'Dhuhr', time: dhuhr, key: 'dhuhr' },
        { name: 'Asr', time: asr, key: 'asr' },
        { name: 'Maghrib', time: maghrib, key: 'maghrib' },
        { name: 'Isha', time: isha, key: 'isha' },
    ];

    return (
        <div style={{
            background: isRamadan ? 'linear-gradient(135deg, #1a472a 0%, #2d5f3f 100%)' : 'white',
            padding: '24px',
            borderRadius: '12px',
            border: isRamadan ? '2px solid #d4af37' : '1px solid #eee',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
        }}>
            {/* Header */}
            <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <h2 style={{
                        fontSize: '1.5rem', // Increased size
                        margin: 0,
                        color: isRamadan ? '#fff' : 'var(--primary-color)',
                        borderBottom: isRamadan ? '2px solid #d4af37' : '2px solid var(--secondary-color)',
                        display: 'inline-block',
                        paddingBottom: '4px'
                    }}>
                        Prayer Times
                    </h2>
                    {isRamadan && (
                        <span style={{
                            background: '#d4af37',
                            color: '#1a472a',
                            padding: '4px 12px',
                            borderRadius: '20px',
                            fontSize: '0.85rem',
                            fontWeight: 'bold'
                        }}>
                            🌙 Ramadan
                        </span>
                    )}
                    {isFriday && !isRamadan && (
                        <span style={{
                            background: 'var(--secondary-color)',
                            color: 'white',
                            padding: '4px 12px',
                            borderRadius: '20px',
                            fontSize: '0.85rem',
                            fontWeight: 'bold'
                        }}>
                            📅 Jumu'ah
                        </span>
                    )}
                </div>
                {timeUntilNext && (
                    <div style={{
                        marginTop: '15px',
                        padding: '12px',
                        background: isRamadan ? 'rgba(212, 175, 55, 0.15)' : '#e0f2fe',
                        borderRadius: '8px',
                        border: isRamadan ? '2px solid #d4af37' : '2px solid #7dd3fc',
                        textAlign: 'center'
                    }}>
                        <p style={{
                            margin: 0,
                            fontSize: '1.1rem',
                            color: isRamadan ? '#d4af37' : '#0c4a6e',
                            fontWeight: '700',
                        }}>
                            Next: <span style={{ textTransform: 'capitalize', color: isRamadan ? 'white' : '#0284c7' }}>{nextPrayer}</span> in {timeUntilNext}
                        </p>
                    </div>
                )}
                <p style={{ fontSize: '0.8rem', color: '#666', margin: '8px 0 0 0', textAlign: 'right' }}>
                    Updated: {new Date().toLocaleDateString()}
                </p>
            </div>

            {/* Jumu'ah Special Row (if Friday) */}
            {jummah && (
                <div style={{
                    background: 'linear-gradient(135deg, #047857 0%, #059669 100%)',
                    color: 'white',
                    padding: '14px 18px',
                    borderRadius: '8px',
                    marginBottom: '20px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    border: '2px solid #10b981',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                }}>
                    <span style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>🕌 Jumu&apos;ah</span>
                    <span style={{ fontWeight: '800', fontSize: '1.3rem' }}>{jummah}</span>
                </div>
            )}

            {/* Prayer Times Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                    {prayers.map((prayer) => {
                        const isNext = prayer.key === nextPrayer;
                        const isRef = prayer.isReference;

                        return (
                            <tr
                                key={prayer.key}
                                style={{
                                    borderBottom: isRamadan ? '1px solid rgba(212, 175, 55, 0.3)' : '1px solid #eee',
                                    background: isNext && !isRef ? (isRamadan ? 'rgba(212, 175, 55, 0.25)' : '#ecfccb') : 'transparent',
                                    borderLeft: isNext && !isRef ? (isRamadan ? '4px solid #d4af37' : '4px solid #84cc16') : '4px solid transparent',
                                    transition: 'background 0.2s ease'
                                }}
                            >
                                <td style={{
                                    padding: '14px 12px',
                                    fontWeight: isNext && !isRef ? '700' : '500',
                                    color: isRamadan ? '#fff' : (isRef ? '#666' : '#1f2937'),
                                    fontSize: isRef ? '0.95rem' : '1.1rem'
                                }}>
                                    {prayer.name}
                                    {isRef && <span style={{ fontSize: '0.8rem', marginLeft: '6px' }}>(Reference)</span>}
                                    {isNext && !isRef && (
                                        <span style={{
                                            marginLeft: '10px',
                                            color: isRamadan ? '#d4af37' : '#4d7c0f',
                                            fontSize: '0.85rem',
                                            fontWeight: '700',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.5px'
                                        }}>
                                            INCOMING
                                        </span>
                                    )}
                                </td>
                                <td style={{
                                    padding: '14px 12px',
                                    fontWeight: isNext && !isRef ? '800' : '600',
                                    textAlign: 'right',
                                    color: isRamadan ? '#fff' : (isRef ? '#666' : '#111'),
                                    fontSize: isNext && !isRef ? '1.25rem' : (isRef ? '1rem' : '1.1rem')
                                }}>
                                    {prayer.time}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>

            {/* Disclaimer */}
            <p style={{
                fontSize: '0.85rem', // Slightly larger
                color: isRamadan ? 'rgba(255, 255, 255, 0.8)' : '#4b5563', // Darker contrast
                marginTop: '20px',
                marginBottom: 0,
                lineHeight: '1.5',
                borderTop: isRamadan ? '1px solid rgba(255,255,255,0.2)' : '1px solid #eee',
                paddingTop: '10px'
            }}>
                <strong>Note:</strong> Times are calculated based on location coordinates and may vary from the mosque&apos;s official jamat times. Please verify with {mosqueName || 'the mosque'} for exact congregation times.
            </p>
        </div>
    );
};

export default PrayerTimesCard;
