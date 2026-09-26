import Link from 'next/link';

export const metadata = {
    title: 'About Us | Mosque Near Me',
    description: 'Learn about our mission to help Muslims find mosques and prayer times across the UK.',
};

const STATS = [
    { num: '2,000+', label: 'Mosques Listed', icon: '🕌' },
    { num: '800+', label: 'Cities Covered', icon: '🏙️' },
    { num: '100K+', label: 'Monthly Visitors', icon: '👥' },
    { num: 'Free', label: 'Always Free', icon: '💚' },
];

const VALUES = [
    { icon: '🎯', title: 'Our Mission', text: 'To connect Muslims across the UK with accurate, up-to-date information on mosque locations, prayer times, and facilities — so no one ever struggles to find a place of worship.' },
    { icon: '📖', title: 'Our Story', text: 'This project began from a personal need. Finding a mosque in an unfamiliar city can be challenging. We wanted a reliable resource that lists not just addresses, but essential details like women\'s prayer areas, parking, and wheelchair access.' },
    { icon: '✅', title: 'Accuracy First', text: 'We work hard to ensure data accuracy. Prayer times and facility details can change, so we rely on our community to help keep information current. Spot an error? Please let us know.' },
    { icon: '💚', title: 'Community Driven', text: 'We are a small team of developers and community members dedicated to serving the UK Muslim community. Your feedback helps us grow and improve every day.' },
];

export default function AboutPage() {
    return (
        <div style={{ background: '#f7f8f5', minHeight: '100vh' }}>

            {/* Hero */}
            <div style={{
                background: 'linear-gradient(135deg, #082e20 0%, #0f4c35 60%, #1a6b4a 100%)',
                padding: '80px 24px 70px',
                textAlign: 'center',
                position: 'relative', overflow: 'hidden',
            }}>
                <div style={{ position: 'absolute', inset: 0, opacity: 0.05, backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23fff' fill-opacity='1' fill-rule='evenodd'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E")` }} />
                <div style={{ position: 'relative', zIndex: 1 }}>
                    <p style={{ color: '#c8a84b', fontWeight: '700', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '14px' }}>
                        🕌 MosqueNearMe.com
                    </p>
                    <h1 style={{ fontSize: 'clamp(2.2rem,5vw,3.5rem)', fontWeight: '900', color: 'white', marginBottom: '16px', letterSpacing: '-0.03em' }}>
                        About Us
                    </h1>
                    <p style={{ color: 'rgba(255,255,255,0.72)', fontSize: '1.1rem', maxWidth: '520px', margin: '0 auto', lineHeight: '1.7' }}>
                        Connecting the UK Muslim community with mosques, prayer times, and Islamic centres — completely free.
                    </p>
                    <div style={{ marginTop: '28px' }}>
                        <Link href="/" style={{
                            display: 'inline-flex', alignItems: 'center', gap: '6px',
                            background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.85)',
                            border: '1.5px solid rgba(255,255,255,0.25)', padding: '10px 22px',
                            borderRadius: '99px', fontWeight: '600', fontSize: '0.875rem', textDecoration: 'none',
                        }}>
                            ← Back to Home
                        </Link>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div style={{ background: 'white', borderBottom: '1px solid #e5e7eb' }}>
                <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px 24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '30px', textAlign: 'center' }}>
                    {STATS.map(s => (
                        <div key={s.label}>
                            <div style={{ fontSize: '2rem', marginBottom: '6px' }}>{s.icon}</div>
                            <div style={{ fontSize: '2rem', fontWeight: '900', color: '#0f4c35', letterSpacing: '-0.03em', lineHeight: 1 }}>{s.num}</div>
                            <div style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: '500', marginTop: '6px' }}>{s.label}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div style={{ maxWidth: '900px', margin: '0 auto', padding: '60px 24px 80px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '24px' }}>
                    {VALUES.map(v => (
                        <div key={v.title} style={{
                            background: 'white', borderRadius: '16px',
                            border: '1px solid #e5e7eb', padding: '28px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                        }}>
                            <div style={{
                                width: '48px', height: '48px',
                                background: 'linear-gradient(135deg, #0f4c35, #1a6b4a)',
                                borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '1.4rem', marginBottom: '16px',
                                boxShadow: '0 4px 12px rgba(15,76,53,0.2)',
                            }}>
                                {v.icon}
                            </div>
                            <h2 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#111827', marginBottom: '10px' }}>{v.title}</h2>
                            <p style={{ color: '#4b5563', lineHeight: '1.7', fontSize: '0.95rem', margin: 0 }}>{v.text}</p>
                        </div>
                    ))}
                </div>

                {/* CTA */}
                <div style={{
                    marginTop: '48px', textAlign: 'center',
                    background: 'linear-gradient(135deg, #082e20, #0f4c35)',
                    borderRadius: '20px', padding: '40px 32px',
                    boxShadow: '0 8px 30px rgba(15,76,53,0.2)',
                }}>
                    <p style={{ fontFamily: "'Amiri', serif", fontSize: '1.4rem', color: 'rgba(200,168,75,0.8)', marginBottom: '12px' }}>
                        وَأَقِيمُوا الصَّلَاةَ
                    </p>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'white', marginBottom: '10px' }}>
                        Want to add or update a mosque?
                    </h3>
                    <p style={{ color: 'rgba(255,255,255,0.65)', marginBottom: '24px', lineHeight: '1.6' }}>
                        Help us keep the directory accurate and complete.
                    </p>
                    <Link href="/contact" style={{
                        display: 'inline-flex', alignItems: 'center', gap: '8px',
                        background: '#c8a84b', color: 'white',
                        padding: '14px 32px', borderRadius: '99px',
                        fontWeight: '700', fontSize: '1rem', textDecoration: 'none',
                        boxShadow: '0 4px 16px rgba(200,168,75,0.35)',
                    }}>
                        📧 Contact Us
                    </Link>
                </div>
            </div>
        </div>
    );
}
