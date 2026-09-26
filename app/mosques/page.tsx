import { getAllMosques } from '@/lib/data';
import Link from 'next/link';

export const metadata = {
    title: 'Browse All Mosques | Mosque Near Me',
    description: 'Browse all mosques and Islamic centres across the UK.',
};

export default async function MosquesPage() {
    const mosques = await getAllMosques();

    return (
        <div style={{ background: '#f7f8f5', minHeight: '100vh' }}>
            {/* Hero */}
            <div style={{
                background: 'linear-gradient(135deg, #082e20 0%, #0f4c35 60%, #1a6b4a 100%)',
                padding: '60px 24px 70px', position: 'relative', overflow: 'hidden',
            }}>
                <div style={{ position: 'absolute', inset: 0, opacity: 0.05, backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23fff' fill-opacity='1' fill-rule='evenodd'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E")` }} />
                <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
                    <nav style={{ fontSize: '0.85rem', display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '24px' }}>
                        <Link href="/" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}>Home</Link>
                        <span style={{ color: 'rgba(255,255,255,0.3)' }}>›</span>
                        <span style={{ color: 'rgba(255,255,255,0.9)' }}>All Mosques</span>
                    </nav>
                    <h1 style={{ fontSize: 'clamp(2rem,4vw,3rem)', fontWeight: '900', color: 'white', marginBottom: '10px', letterSpacing: '-0.03em' }}>
                        All UK Mosques
                    </h1>
                    <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1rem' }}>
                        Browsing {mosques.length.toLocaleString()} mosques and Islamic centres across the UK.
                    </p>
                </div>
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, lineHeight: 0 }}>
                    <svg viewBox="0 0 1440 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M0 48L60 40C120 32 240 16 360 12C480 8 600 16 720 22C840 28 960 34 1080 32C1200 30 1320 22 1380 18L1440 14V48H0Z" fill="#f7f8f5"/>
                    </svg>
                </div>
            </div>

            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '36px 24px 80px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                    {mosques.map(m => (
                        <Link key={m.slug} href={`/mosques/${m.slug}`} style={{
                            display: 'flex', flexDirection: 'column',
                            background: 'white', borderRadius: '14px',
                            border: '1px solid #e5e7eb', padding: '20px',
                            textDecoration: 'none', transition: 'all 0.2s',
                            boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
                            position: 'relative', overflow: 'hidden',
                        }} className="mosque-card">
                            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', background: 'linear-gradient(180deg, #0f4c35, #2d8a61)' }} />
                            <div style={{ paddingLeft: '8px' }}>
                                <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#111827', marginBottom: '4px' }}>{m.name}</h3>
                                <p style={{ color: '#6b7280', fontSize: '0.85rem', marginBottom: '12px' }}>📍 {m.city}</p>
                                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                    <span style={{ background: '#dbeafe', color: '#1e40af', padding: '3px 10px', borderRadius: '99px', fontSize: '0.75rem', fontWeight: '600' }}>{m.category}</span>
                                    {m.ladies && <span style={{ background: '#fce7f3', color: '#9d174d', padding: '3px 10px', borderRadius: '99px', fontSize: '0.75rem', fontWeight: '600' }}>Ladies</span>}
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            <style>{`.mosque-card:hover { transform: translateY(-3px); box-shadow: 0 10px 28px rgba(15,76,53,0.12) !important; border-color: rgba(15,76,53,0.2) !important; }`}</style>
        </div>
    );
}
