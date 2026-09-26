'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mosque } from '@/lib/types';

function SearchContent() {
    const searchParams = useSearchParams();
    const q = searchParams.get('q') || '';
    const query = q.toLowerCase().trim();
    const router = useRouter();

    const [input, setInput] = useState(q);
    const [mosques, setMosques] = useState<Mosque[]>([]);
    const [results, setResults] = useState<Mosque[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/mosques.json')
            .then(r => r.json())
            .then((data: Mosque[]) => { setMosques(data); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    useEffect(() => {
        if (!loading && mosques.length > 0 && query) {
            setResults(mosques.filter(m =>
                m.name.toLowerCase().includes(query) ||
                m.city.toLowerCase().includes(query) ||
                m.address.toLowerCase().includes(query) ||
                m.postcode.toLowerCase().includes(query)
            ));
        } else if (!query) {
            setResults([]);
        }
    }, [query, mosques, loading]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim()) router.push(`/search?q=${encodeURIComponent(input.trim())}`);
    };

    return (
        <div style={{ background: '#f7f8f5', minHeight: '100vh' }}>

            {/* Search Hero */}
            <div style={{
                background: 'linear-gradient(135deg, #082e20 0%, #0f4c35 60%, #1a6b4a 100%)',
                padding: '60px 24px 70px', position: 'relative', overflow: 'hidden',
            }}>
                <div style={{ position: 'absolute', inset: 0, opacity: 0.05, backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23fff' fill-opacity='1' fill-rule='evenodd'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E")` }} />
                <div style={{ maxWidth: '700px', margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
                    <h1 style={{ fontSize: 'clamp(2rem,4vw,3rem)', fontWeight: '900', color: 'white', marginBottom: '8px', letterSpacing: '-0.03em' }}>
                        {q ? `Results for "${q}"` : 'Search Mosques'}
                    </h1>
                    <p style={{ color: 'rgba(255,255,255,0.65)', marginBottom: '28px', fontSize: '1rem' }}>
                        Search by mosque name, city, or postcode
                    </p>

                    {/* Search form */}
                    <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px', maxWidth: '600px', margin: '0 auto' }}>
                        <div style={{ flex: 1, position: 'relative' }}>
                            <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '1.1rem', pointerEvents: 'none' }}>🔍</span>
                            <input
                                type="text"
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                placeholder="e.g. Birmingham, East London Mosque..."
                                style={{
                                    width: '100%', padding: '14px 14px 14px 44px',
                                    borderRadius: '10px', border: '2px solid rgba(255,255,255,0.3)',
                                    fontSize: '1rem', fontFamily: 'inherit', outline: 'none',
                                    background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)',
                                    color: 'white',
                                }}
                            />
                        </div>
                        <button type="submit" style={{
                            background: '#c8a84b', color: 'white', border: 'none',
                            padding: '0 24px', borderRadius: '10px', fontWeight: '700',
                            fontSize: '0.95rem', cursor: 'pointer', fontFamily: 'inherit',
                            whiteSpace: 'nowrap', boxShadow: '0 4px 16px rgba(200,168,75,0.35)',
                        }}>
                            Search
                        </button>
                    </form>
                </div>

                {/* Wave */}
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, lineHeight: 0 }}>
                    <svg viewBox="0 0 1440 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M0 48L60 40C120 32 240 16 360 12C480 8 600 16 720 22C840 28 960 34 1080 32C1200 30 1320 22 1380 18L1440 14V48H0Z" fill="#f7f8f5"/>
                    </svg>
                </div>
            </div>

            {/* Results */}
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '36px 24px 80px' }}>
                <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#0f4c35', fontWeight: '600', fontSize: '0.9rem', marginBottom: '28px', textDecoration: 'none' }}>
                    ← Back to Home
                </Link>

                {loading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px', gap: '16px' }}>
                        <div style={{ width: '44px', height: '44px', border: '4px solid #e5e7eb', borderTop: '4px solid #0f4c35', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                        <p style={{ color: '#6b7280', fontWeight: '500' }}>Loading mosque data...</p>
                        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
                    </div>
                ) : q && results.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 20px', background: 'white', borderRadius: '16px', border: '1px solid #e5e7eb' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🔍</div>
                        <h2 style={{ fontSize: '1.4rem', fontWeight: '700', color: '#111827', marginBottom: '8px' }}>No results for &quot;{q}&quot;</h2>
                        <p style={{ color: '#6b7280', marginBottom: '20px' }}>Try a city name (e.g. &quot;London&quot;) or mosque name.</p>
                        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#0f4c35', color: 'white', padding: '12px 28px', borderRadius: '99px', fontWeight: '700', textDecoration: 'none' }}>
                            Browse All Mosques
                        </Link>
                    </div>
                ) : results.length > 0 ? (
                    <>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '10px' }}>
                            <h2 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#111827' }}>
                                Found <span style={{ color: '#0f4c35' }}>{results.length}</span> mosque{results.length !== 1 ? 's' : ''}
                            </h2>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                            {results.map(m => (
                                <Link key={m.slug} href={`/mosques/${m.slug}`} style={{
                                    display: 'flex', flexDirection: 'column',
                                    background: 'white', borderRadius: '14px',
                                    border: '1px solid #e5e7eb', padding: '20px',
                                    textDecoration: 'none', transition: 'all 0.2s',
                                    boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
                                    position: 'relative', overflow: 'hidden',
                                }} className="search-card">
                                    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', background: 'linear-gradient(180deg, #0f4c35, #2d8a61)' }} />
                                    <div style={{ paddingLeft: '8px' }}>
                                        <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#111827', marginBottom: '4px' }}>{m.name}</h3>
                                        <p style={{ color: '#6b7280', fontSize: '0.85rem', marginBottom: '12px' }}>📍 {m.address}</p>
                                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                                            <span style={{ background: '#dbeafe', color: '#1e40af', padding: '3px 10px', borderRadius: '99px', fontSize: '0.75rem', fontWeight: '600' }}>{m.category}</span>
                                            <span style={{ background: '#f3f4f6', color: '#374151', padding: '3px 10px', borderRadius: '99px', fontSize: '0.75rem', fontWeight: '600' }}>{m.city}</span>
                                            {m.facilities.wudu && <span title="Wudu">💧</span>}
                                            {m.facilities.parking && <span title="Parking">🅿️</span>}
                                            {m.facilities.womenArea && <span title="Women's Area">🧕</span>}
                                            {m.facilities.jummahPrayer && <span title="Jumu'ah">🕌</span>}
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </>
                ) : !q ? (
                    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                        <div style={{ fontSize: '3.5rem', marginBottom: '16px' }}>🕌</div>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#111827', marginBottom: '8px' }}>Find Any Mosque in the UK</h2>
                        <p style={{ color: '#6b7280', fontSize: '1rem' }}>Enter a mosque name, city or postcode above to get started.</p>
                    </div>
                ) : null}
            </div>

            <style>{`.search-card:hover { transform: translateY(-3px); box-shadow: 0 10px 28px rgba(15,76,53,0.12) !important; border-color: rgba(15,76,53,0.2) !important; }`}</style>
        </div>
    );
}

export default function SearchPage() {
    return (
        <Suspense fallback={
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ width: '44px', height: '44px', border: '4px solid #e5e7eb', borderTop: '4px solid #0f4c35', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
                    <p style={{ color: '#6b7280' }}>Loading search...</p>
                </div>
            </div>
        }>
            <SearchContent />
        </Suspense>
    );
}
