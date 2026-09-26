import { getAllMosques, getMosqueBySlug, getNearbyMosques } from '@/lib/data';
import { getPrayerTimes } from '@/lib/prayer-times';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import MosqueMapClient from '../../../components/MosqueMapClient';
import PrayerTimesCard from '../../../components/PrayerTimesCard';
import CopyAddressButton from '../../../components/CopyAddressButton';
import AdBanner from '../../../components/AdBanner';
import AdInArticle from '../../../components/AdInArticle';
import { buildMosqueMetadata } from '@/lib/seo/metadata';
import { mosqueUrl, toCitySlug } from '@/lib/seo/url';

interface PageProps { params: Promise<{ slug: string }>; }

export async function generateStaticParams() {
  const mosques = await getAllMosques();
  return mosques.map((m) => ({ slug: m.slug }));
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const mosque = await getMosqueBySlug(slug);
  if (!mosque) return { title: 'Mosque Not Found', robots: { index: false, follow: false } };
  return buildMosqueMetadata(mosque);
}

const mapTag = (tag: string) => {
  const m: Record<string, string> = {
    'Deob': 'Deobandi', 'SufiPkstn': 'Barelvi / Sufi', 'Sufi': 'Sufi',
    'Salafi': 'Salafi', 'AhleHadeeth': 'Ahle Hadeeth', 'Shia': 'Shia',
    'Maudoodi': 'Jamaat-e-Islami', 'Barelvi': 'Barelvi',
  };
  return m[tag] || tag;
};

const citySlug = (city: string) =>
  city.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const FACILITIES = [
  { key: 'wudu', emoji: '💧', label: 'Wudu Facilities' },
  { key: 'womenArea', emoji: '🧕', label: "Women's Area" },
  { key: 'parking', emoji: '🅿️', label: 'Parking' },
  { key: 'wheelchairAccess', emoji: '♿', label: 'Wheelchair Access' },
  { key: 'jummahPrayer', emoji: '🕌', label: "Jumu'ah Prayers" },
  { key: 'dailyPrayers', emoji: '🕐', label: 'Daily Prayers' },
  { key: 'airCon', emoji: '❄️', label: 'Air Conditioning' },
  { key: 'library', emoji: '📚', label: 'Library' },
  { key: 'childrenArea', emoji: '🧸', label: "Children's Area" },
  { key: 'janazah', emoji: '🤲', label: 'Janazah Facilities' },
];

export default async function MosquePage({ params }: PageProps) {
  const { slug } = await params;
  const mosque = await getMosqueBySlug(slug);
  if (!mosque) notFound();

  const prayerTimes = getPrayerTimes(mosque.lat, mosque.lng);
  const nearbyMosques = await getNearbyMosques(mosque.lat, mosque.lng);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Mosque',
        name: mosque.name,
        address: { '@type': 'PostalAddress', streetAddress: mosque.address, addressLocality: mosque.city, addressCountry: 'GB' },
        geo: { '@type': 'GeoCoordinates', latitude: mosque.lat, longitude: mosque.lng },
        url: mosqueUrl(mosque.slug),
        telephone: mosque.phone || undefined,
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://mosquenearme.net/' },
          { '@type': 'ListItem', position: 2, name: mosque.city, item: `https://mosquenearme.net/cities/${toCitySlug(mosque.city)}/` },
          { '@type': 'ListItem', position: 3, name: mosque.name, item: mosqueUrl(mosque.slug) },
        ],
      },
    ],
  };

  const activeFacilities = FACILITIES.filter(f => mosque.facilities[f.key as keyof typeof mosque.facilities]);

  return (
    <div style={{ background: '#f7f8f5', minHeight: '100vh' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* ── HERO HEADER ── */}
      <div style={{
        background: 'linear-gradient(135deg, #082e20 0%, #0f4c35 60%, #1a6b4a 100%)',
        padding: '0 0 40px',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Pattern overlay */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.05,
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23fff' fill-opacity='1' fill-rule='evenodd'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E")`,
        }} />

        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px', position: 'relative', zIndex: 1 }}>
          {/* Breadcrumb */}
          <nav style={{ padding: '20px 0 30px', fontSize: '0.85rem', display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
            <Link href="/" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}>Home</Link>
            <span style={{ color: 'rgba(255,255,255,0.3)' }}>›</span>
            <Link href={`/cities/${citySlug(mosque.city)}`} style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}>{mosque.city}</Link>
            <span style={{ color: 'rgba(255,255,255,0.3)' }}>›</span>
            <span style={{ color: 'rgba(255,255,255,0.9)' }}>{mosque.name}</span>
          </nav>

          {/* Mosque name + tags */}
          <h1 style={{ fontSize: 'clamp(1.8rem,4vw,2.8rem)', fontWeight: '900', color: 'white', marginBottom: '16px', lineHeight: '1.2', letterSpacing: '-0.02em' }}>
            {mosque.name}
          </h1>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '24px' }}>
            <span style={{ background: 'rgba(200,168,75,0.25)', color: '#e0c068', border: '1px solid rgba(200,168,75,0.4)', padding: '4px 14px', borderRadius: '99px', fontSize: '0.82rem', fontWeight: '700' }}>
              {mosque.category}
            </span>
            {mosque.theme && mosque.theme !== 'General' && (
              <span style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)', border: '1px solid rgba(255,255,255,0.2)', padding: '4px 14px', borderRadius: '99px', fontSize: '0.82rem', fontWeight: '600' }}>
                {mapTag(mosque.theme)}
              </span>
            )}
            {mosque.ladies && (
              <span style={{ background: 'rgba(134,239,172,0.2)', color: '#86efac', border: '1px solid rgba(134,239,172,0.3)', padding: '4px 14px', borderRadius: '99px', fontSize: '0.82rem', fontWeight: '600' }}>
                🧕 Ladies Facilities
              </span>
            )}
            {mosque.facilities.jummahPrayer && (
              <span style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)', border: '1px solid rgba(255,255,255,0.2)', padding: '4px 14px', borderRadius: '99px', fontSize: '0.82rem', fontWeight: '600' }}>
                🕌 Jumu&apos;ah
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(255,255,255,0.75)', fontSize: '0.95rem' }}>
            <span>📍</span>
            <span>{mosque.address}</span>
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '30px 24px 80px' }}>

        {/* Back link */}
        <Link href={`/cities/${citySlug(mosque.city)}`} style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          color: '#0f4c35', fontWeight: '600', fontSize: '0.9rem',
          marginBottom: '28px', textDecoration: 'none',
        }}>
          ← Back to {mosque.city} Mosques
        </Link>

        <div style={{ display: 'flex', gap: '28px', flexWrap: 'wrap', alignItems: 'flex-start' }}>

          {/* ── LEFT COLUMN ── */}
          <div style={{ flex: '2', minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Warning banner */}
            {(!mosque.locationPrecise || !mosque.infoVerified) && (
              <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: '12px', padding: '14px 18px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>⚠️</span>
                <div style={{ fontSize: '0.875rem', color: '#92400e', lineHeight: '1.5' }}>
                  {!mosque.locationPrecise && <p style={{ margin: '0 0 4px' }}><strong>Approximate Location:</strong> Map marker may be off by &gt;100m.</p>}
                  {!mosque.infoVerified && <p style={{ margin: 0 }}><strong>Unverified Info:</strong> Details may contain inaccuracies.</p>}
                </div>
              </div>
            )}

            {/* Details card */}
            <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e5e7eb', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <div style={{ padding: '6px 20px', background: 'linear-gradient(90deg, #0f4c35, #1a6b4a)' }}>
                <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Mosque Details</span>
              </div>
              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '1.1rem', flexShrink: 0, marginTop: '2px' }}>📍</span>
                  <div>
                    <p style={{ fontWeight: '600', color: '#111827', marginBottom: '4px', fontSize: '0.875rem' }}>Address</p>
                    <p style={{ color: '#4b5563', fontSize: '0.95rem' }}>{mosque.address}</p>
                    <div style={{ display: 'flex', gap: '10px', marginTop: '8px', flexWrap: 'wrap' }}>
                      <CopyAddressButton address={mosque.address} />
                      <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mosque.address)}`} target="_blank" rel="noopener noreferrer"
                        style={{ fontSize: '0.85rem', color: '#0f4c35', fontWeight: '600', textDecoration: 'none' }}>
                        View on Maps →
                      </a>
                    </div>
                  </div>
                </div>
                {mosque.phone && (
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <span style={{ fontSize: '1.1rem' }}>📞</span>
                    <div>
                      <p style={{ fontWeight: '600', color: '#111827', fontSize: '0.875rem', marginBottom: '2px' }}>Phone</p>
                      <a href={`tel:${mosque.phone}`} style={{ color: '#0f4c35', fontWeight: '600', fontSize: '0.95rem' }}>{mosque.phone}</a>
                    </div>
                  </div>
                )}
                {mosque.capacity > 0 && (
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <span style={{ fontSize: '1.1rem' }}>👥</span>
                    <div>
                      <p style={{ fontWeight: '600', color: '#111827', fontSize: '0.875rem', marginBottom: '2px' }}>Capacity</p>
                      <p style={{ color: '#4b5563', fontSize: '0.95rem' }}>{mosque.capacity} worshippers</p>
                    </div>
                  </div>
                )}

                {/* Directions CTA */}
                <a href={`https://www.google.com/maps/dir/?api=1&destination=${mosque.lat},${mosque.lng}`} target="_blank" rel="noopener noreferrer"
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    background: 'linear-gradient(135deg, #0f4c35, #1a6b4a)',
                    color: 'white', padding: '14px', borderRadius: '10px',
                    fontWeight: '700', fontSize: '1rem', textDecoration: 'none',
                    boxShadow: '0 4px 16px rgba(15,76,53,0.25)',
                    marginTop: '6px', transition: 'all 0.2s',
                  }}>
                  📍 Get Directions
                </a>
              </div>
            </div>

            {/* Support this Mosque CTA */}
            {mosque.acceptsDonations !== false && (
              <div
                style={{
                  background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
                  borderRadius: '16px',
                  border: '1.5px solid #a7f3d0',
                  padding: '20px 24px',
                  boxShadow: '0 2px 8px rgba(16, 185, 129, 0.08)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '16px',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '1.3rem' }}>🤲</span>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#065f46', margin: 0 }}>
                      Support this Mosque
                    </h3>
                  </div>
                  <p style={{ color: '#047857', fontSize: '0.88rem', margin: 0 }}>
                    Help support {mosque.name} and its local community through MosqueNearMe.
                  </p>
                </div>
                <Link
                  href={`/donate?mosque=${encodeURIComponent(mosque.slug)}`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: '#0f4c35',
                    color: 'white',
                    padding: '12px 24px',
                    borderRadius: '10px',
                    fontWeight: '700',
                    fontSize: '0.95rem',
                    textDecoration: 'none',
                    boxShadow: '0 4px 12px rgba(15, 76, 53, 0.25)',
                    transition: 'all 0.2s',
                  }}
                >
                  💳 Donate
                </Link>
              </div>
            )}

            {/* Travel options */}
            <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e5e7eb', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <div style={{ padding: '6px 20px', background: 'linear-gradient(90deg, #0f4c35, #1a6b4a)' }}>
                <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Travel Options</span>
              </div>
              <div style={{ padding: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {[
                  { label: '🚗 Driving', url: `https://www.google.com/maps/dir/?api=1&destination=${mosque.lat},${mosque.lng}`, bg: '#0f4c35', color: 'white' },
                  { label: '🚌 Transit', url: `https://www.google.com/maps/dir/?api=1&destination=${mosque.lat},${mosque.lng}&travelmode=transit`, bg: 'white', color: '#111827', border: '1.5px solid #e5e7eb' },
                  { label: '🗺️ Citymapper', url: `https://citymapper.com/directions?endcoord=${mosque.lat},${mosque.lng}&endname=${encodeURIComponent(mosque.name)}`, bg: '#00c8a0', color: 'white' },
                ].map(b => (
                  <a key={b.label} href={b.url} target="_blank" rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '6px',
                      background: b.bg, color: b.color,
                      border: b.border || 'none',
                      padding: '10px 18px', borderRadius: '99px',
                      fontWeight: '600', fontSize: '0.875rem', textDecoration: 'none',
                    }}>
                    {b.label}
                  </a>
                ))}
              </div>
            </div>

            <AdInArticle slot="6267753114" />

            {/* Facilities */}
            {activeFacilities.length > 0 && (
              <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e5e7eb', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                <div style={{ padding: '6px 20px', background: 'linear-gradient(90deg, #0f4c35, #1a6b4a)' }}>
                  <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Facilities & Amenities</span>
                </div>
                <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
                  {activeFacilities.map(f => (
                    <div key={f.key} style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      background: '#f0fdf4', borderRadius: '10px', padding: '12px 14px',
                      border: '1px solid #bbf7d0',
                    }}>
                      <span style={{ fontSize: '1.3rem' }}>{f.emoji}</span>
                      <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#065f46' }}>{f.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Jummah highlight */}
            {mosque.facilities.jummahPrayer && (
              <div style={{
                background: 'linear-gradient(135deg, #064e3b, #065f46)',
                borderRadius: '16px', padding: '20px 24px',
                border: '1px solid #059669',
                display: 'flex', gap: '16px', alignItems: 'flex-start',
              }}>
                <span style={{ fontSize: '2rem', flexShrink: 0 }}>🕌</span>
                <div>
                  <h3 style={{ color: 'white', fontWeight: '700', marginBottom: '6px', fontSize: '1.05rem' }}>
                    Jumu&apos;ah Prayers Available
                  </h3>
                  <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.875rem', lineHeight: '1.6', margin: 0 }}>
                    Friday prayers are held at this mosque. Please contact them directly for exact Khutbah and Jamaat times.
                  </p>
                </div>
              </div>
            )}

            {/* Prayer Times */}
            <PrayerTimesCard prayerTimes={prayerTimes} mosqueName={mosque.name} />
          </div>

          {/* ── RIGHT SIDEBAR ── */}
          <div style={{ flex: '1', minWidth: '280px', position: 'sticky', top: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Map */}
            <div style={{ borderRadius: '16px', overflow: 'hidden', height: '300px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb' }}>
              <MosqueMapClient lat={mosque.lat} lng={mosque.lng} name={mosque.name} />
            </div>

            {/* Nearby mosques */}
            <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e5e7eb', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.1rem' }}>📍</span>
                <h2 style={{ fontSize: '1rem', fontWeight: '700', color: '#111827', margin: 0 }}>Nearby Mosques</h2>
              </div>
              <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {nearbyMosques.map(m => {
                  const dist = (m as any).distance;
                  return (
                    <Link key={m.slug} href={`/mosques/${m.slug}`} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '12px 14px', background: '#f9fafb',
                      borderRadius: '10px', border: '1px solid #f3f4f6',
                      textDecoration: 'none', transition: 'all 0.2s',
                    }}
                      className="nearby-card">
                      <div>
                        <p style={{ fontSize: '0.875rem', fontWeight: '600', color: '#111827', margin: '0 0 2px' }}>{m.name}</p>
                        <p style={{ fontSize: '0.78rem', color: '#6b7280', margin: 0 }}>{m.city}</p>
                      </div>
                      <span style={{
                        fontSize: '0.78rem', fontWeight: '700', flexShrink: 0,
                        background: '#d1fae5', color: '#065f46',
                        padding: '3px 8px', borderRadius: '99px',
                      }}>
                        {dist.toFixed(1)} km
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>

            <AdBanner slot="3082530032" />
          </div>
        </div>
      </div>

      {/* Mobile sticky CTA */}
      <div className="mobile-cta" style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        padding: '12px 16px', background: 'white',
        boxShadow: '0 -4px 20px rgba(0,0,0,0.1)',
        zIndex: 1000, display: 'none',
      }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <a href={`https://www.google.com/maps/dir/?api=1&destination=${mosque.lat},${mosque.lng}`}
            target="_blank" rel="noopener noreferrer"
            style={{
              flex: 1, background: 'linear-gradient(135deg, #0f4c35, #1a6b4a)',
              color: 'white', padding: '14px', borderRadius: '12px',
              fontWeight: '700', fontSize: '0.95rem', textAlign: 'center', textDecoration: 'none',
            }}>
            📍 Directions
          </a>
          {mosque.acceptsDonations !== false && (
            <Link href={`/donate?mosque=${encodeURIComponent(mosque.slug)}`}
              style={{
                flex: 1, background: 'linear-gradient(135deg, #c8a84b, #a08235)',
                color: 'white', padding: '14px', borderRadius: '12px',
                fontWeight: '700', fontSize: '0.95rem', textAlign: 'center', textDecoration: 'none',
              }}>
              💳 Donate
            </Link>
          )}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
          @media (max-width: 768px) {
            .mobile-cta { display: block !important; }
          }
          .nearby-card:hover {
            background: #f0fdf4 !important;
            border-color: #bbf7d0 !important;
          }
        `
      }} />
    </div>
  );
}
