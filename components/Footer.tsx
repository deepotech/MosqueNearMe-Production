import Link from 'next/link';

export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer style={{
            background: 'linear-gradient(180deg, #0a3523 0%, #071e14 100%)',
            color: 'white',
            paddingTop: '70px',
            marginTop: 'auto',
        }}>
            <div className="container">
                {/* Top grid */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '50px',
                    paddingBottom: '50px',
                }}>
                    {/* Brand */}
                    <div style={{ gridColumn: 'span 1' }}>
                        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
                            <span style={{ fontSize: '2rem' }}>🕌</span>
                            <span style={{ fontSize: '1.2rem', fontWeight: '800', color: 'white', letterSpacing: '-0.02em' }}>
                                Mosque<span style={{ color: '#c8a84b' }}>NearMe</span>
                            </span>
                        </Link>
                        <p style={{ color: 'rgba(255,255,255,0.55)', lineHeight: '1.75', fontSize: '0.9rem', maxWidth: '260px' }}>
                            Connecting the Muslim community with accurate prayer times and mosque locations across the UK & Ireland.
                        </p>
                        {/* Arabic */}
                        <p style={{
                            marginTop: '20px',
                            fontFamily: "'Amiri', serif",
                            fontSize: '1.2rem',
                            color: 'rgba(200,168,75,0.7)',
                            letterSpacing: '0.05em',
                        }}>
                            وَأَقِيمُوا الصَّلَاةَ
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 style={{ fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.4)', marginBottom: '20px' }}>
                            Explore
                        </h3>
                        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {[
                                { href: '/', label: 'Home' },
                                { href: '#near-me', label: '📍 Mosques Near Me' },
                                { href: '#cities', label: '🏙️ Browse by City' },
                                { href: '/search', label: '🔍 Search Mosques' },
                                { href: '/donate', label: '🤲 Support a Mosque' },
                            ].map(l => (
                                <li key={l.href}>
                                    <Link href={l.href} style={{
                                        color: 'rgba(255,255,255,0.65)',
                                        fontSize: '0.95rem',
                                        transition: 'color 0.2s',
                                        fontWeight: '500',
                                    }}>
                                        {l.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Top Cities */}
                    <div>
                        <h3 style={{ fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.4)', marginBottom: '20px' }}>
                            Top Cities
                        </h3>
                        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {['London', 'Birmingham', 'Manchester', 'Bradford', 'Leeds', 'Leicester'].map(city => (
                                <li key={city}>
                                    <Link href={`/cities/${city.toLowerCase()}`} style={{
                                        color: 'rgba(255,255,255,0.65)',
                                        fontSize: '0.95rem',
                                        transition: 'color 0.2s',
                                        fontWeight: '500',
                                    }}>
                                        {city}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Legal */}
                    <div>
                        <h3 style={{ fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.4)', marginBottom: '20px' }}>
                            Company
                        </h3>
                        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {[
                                { href: '/about', label: 'About Us' },
                                { href: '/contact', label: 'Contact Us' },
                                { href: '/privacy', label: 'Privacy Policy' },
                                { href: '/terms', label: 'Terms of Service' },
                            ].map(l => (
                                <li key={l.href}>
                                    <Link href={l.href} style={{
                                        color: 'rgba(255,255,255,0.65)',
                                        fontSize: '0.95rem',
                                        transition: 'color 0.2s',
                                        fontWeight: '500',
                                    }}>
                                        {l.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Divider */}
                <div style={{ height: '1px', background: 'rgba(255,255,255,0.08)', marginBottom: '28px' }} />

                {/* Bottom bar */}
                <div style={{
                    display: 'flex', flexWrap: 'wrap', gap: '16px',
                    justifyContent: 'space-between', alignItems: 'center',
                    paddingBottom: '32px',
                }}>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.875rem' }}>
                        © {currentYear} MosqueNearMe.com — All rights reserved.
                    </p>
                    <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.8rem' }}>
                        Made with 💚 for the Muslim community in the UK
                    </p>
                </div>
            </div>
        </footer>
    );
}
