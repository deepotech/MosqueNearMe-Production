import { getAllMosques } from '@/lib/data';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import CityMosqueList from '@/components/CityMosqueList';
import AdBanner from '@/components/AdBanner';
import { buildCityMetadata } from '@/lib/seo/metadata';
import { mosqueUrl, toCitySlug } from '@/lib/seo/url';

interface PageProps { params: Promise<{ city: string }>; }

export async function generateStaticParams() {
    try {
        const mosques = await getAllMosques();
        const cities = new Set<string>();
        mosques.forEach(m => {
            if (m.city && m.city !== 'Unknown' && m.city !== 'Unknown Area') cities.add(m.city);
        });
        return Array.from(cities)
            .map(city => ({ city: city.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') }))
            .filter(p => p.city.length > 0);
    } catch { return []; }
}

export async function generateMetadata({ params }: PageProps) {
    const { city } = await params;
    try {
        const mosques = await getAllMosques();
        const searchSlug = city === 'city-of-stoke-on-trent' ? 'stoke-on-trent' : city.toLowerCase();
        const cityMosques = mosques.filter(m =>
            m.city.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') === searchSlug
        );
        if (cityMosques.length === 0) return { title: 'City Not Found', robots: { index: false, follow: false } };
        return buildCityMetadata(cityMosques[0].city, cityMosques.length);
    } catch {
        return { title: 'Error', robots: { index: false, follow: false } };
    }
}

export default async function CityPage({ params }: PageProps) {
    try {
        const mosques = await getAllMosques();
        const { city: citySlug } = await params;
        const searchSlug = citySlug === 'city-of-stoke-on-trent' ? 'stoke-on-trent' : citySlug.toLowerCase();

        const cityMosques = mosques.filter(m =>
            m.city.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') === searchSlug
        );

        if (cityMosques.length === 0) notFound();

        const cityName = cityMosques[0].city;

        // Facility stats
        const withWudu = cityMosques.filter(m => m.facilities.wudu).length;
        const withParking = cityMosques.filter(m => m.facilities.parking).length;
        const withWomen = cityMosques.filter(m => m.facilities.womenArea).length;
        const withJummah = cityMosques.filter(m => m.facilities.jummahPrayer).length;

        const jsonLd = {
            '@context': 'https://schema.org',
            '@graph': [
                {
                    '@type': 'ItemList',
                    name: `Mosques in ${cityName}`,
                    itemListElement: cityMosques.map((m, i) => ({
                        '@type': 'ListItem',
                        position: i + 1,
                        item: {
                            '@type': 'Mosque',
                            name: m.name,
                            url: mosqueUrl(m.slug),
                            address: { '@type': 'PostalAddress', addressLocality: cityName, streetAddress: m.address },
                        },
                    })),
                },
                {
                    '@type': 'BreadcrumbList',
                    itemListElement: [
                        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://mosquenearme.net/' },
                        { '@type': 'ListItem', position: 2, name: 'Cities', item: 'https://mosquenearme.net/cities/' },
                        { '@type': 'ListItem', position: 3, name: cityName, item: `https://mosquenearme.net/cities/${toCitySlug(cityName)}/` },
                    ],
                },
            ],
        };

        return (
            <div style={{ background: '#f7f8f5', minHeight: '100vh' }}>
                <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

                {/* ── CITY HERO ── */}
                <div style={{
                    background: 'linear-gradient(135deg, #082e20 0%, #0f4c35 60%, #1a6b4a 100%)',
                    position: 'relative', overflow: 'hidden', paddingBottom: '50px',
                }}>
                    <div style={{
                        position: 'absolute', inset: 0, opacity: 0.05,
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23fff' fill-opacity='1' fill-rule='evenodd'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E")`,
                    }} />

                    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px', position: 'relative', zIndex: 1 }}>
                        {/* Breadcrumb */}
                        <nav style={{ padding: '20px 0 28px', fontSize: '0.85rem', display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                            <Link href="/" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}>Home</Link>
                            <span style={{ color: 'rgba(255,255,255,0.3)' }}>›</span>
                            <span style={{ color: 'rgba(255,255,255,0.9)' }}>{cityName}</span>
                        </nav>

                        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
                            <div>
                                <p style={{ color: 'rgba(200,168,75,0.9)', fontWeight: '700', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>
                                    🕌 UK Mosque Directory
                                </p>
                                <h1 style={{ fontSize: 'clamp(2rem,5vw,3.2rem)', fontWeight: '900', color: 'white', lineHeight: '1.15', letterSpacing: '-0.03em', marginBottom: '12px' }}>
                                    Mosques in {cityName}
                                </h1>
                                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1rem', maxWidth: '480px', lineHeight: '1.6' }}>
                                    {cityMosques.length} mosques, Islamic centres & prayer rooms — with facilities, prayer times & directions.
                                </p>
                            </div>

                            <Link href="/" style={{
                                display: 'inline-flex', alignItems: 'center', gap: '6px',
                                background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.85)',
                                border: '1.5px solid rgba(255,255,255,0.25)',
                                padding: '10px 20px', borderRadius: '99px',
                                fontWeight: '600', fontSize: '0.875rem', textDecoration: 'none',
                                backdropFilter: 'blur(8px)',
                                flexShrink: 0,
                            }}>
                                ← Browse All Cities
                            </Link>
                        </div>

                        {/* City Stats */}
                        <div style={{
                            display: 'flex', gap: '16px', marginTop: '36px',
                            flexWrap: 'wrap',
                        }}>
                            {[
                                { num: cityMosques.length, label: 'Total Mosques' },
                                { num: withJummah, label: "Jumu'ah Prayers" },
                                { num: withWomen, label: "Women's Areas" },
                                { num: withParking, label: 'Parking Available' },
                                { num: withWudu, label: 'Wudu Facilities' },
                            ].map(stat => (
                                <div key={stat.label} style={{
                                    background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)',
                                    border: '1px solid rgba(255,255,255,0.15)',
                                    borderRadius: '12px', padding: '14px 20px',
                                    textAlign: 'center', minWidth: '100px',
                                }}>
                                    <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#c8a84b' }}>{stat.num}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.65)', fontWeight: '500', marginTop: '3px' }}>{stat.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Wave */}
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, lineHeight: 0 }}>
                        <svg viewBox="0 0 1440 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M0 48L60 40C120 32 240 16 360 12C480 8 600 16 720 22C840 28 960 34 1080 32C1200 30 1320 22 1380 18L1440 14V48H0Z" fill="#f7f8f5"/>
                        </svg>
                    </div>
                </div>

                {/* ── MAIN CONTENT ── */}
                <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '36px 24px 80px' }}>
                    {/* Ad */}
                    <div style={{ marginBottom: '28px' }}>
                        <AdBanner slot="3082530032" />
                    </div>

                    <CityMosqueList mosques={cityMosques} cityName={cityName} />
                </div>
            </div>
        );
    } catch (error) {
        return (
            <div className="container" style={{ padding: '60px 24px', textAlign: 'center' }}>
                <h1 style={{ fontSize: '2rem', color: '#111827', marginBottom: '12px' }}>Oops — Something went wrong</h1>
                <p style={{ color: '#6b7280', marginBottom: '20px' }}>There was an error loading mosques for this city. Please try again later.</p>
                <Link href="/" style={{ color: '#0f4c35', fontWeight: '700' }}>← Return Home</Link>
            </div>
        );
    }
}
