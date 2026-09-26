import Link from 'next/link';
import { getAllMosques } from '@/lib/data';
import NearMeSection from '@/components/NearMeSection';
import SearchBox from '@/components/SearchBox';
import AdBanner from '@/components/AdBanner';

function generateSlug(text: string): string {
  return text.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

const CITY_ICONS: Record<string, string> = {
  London: '🏙️', Birmingham: '🏭', Manchester: '🌧️', Bradford: '🏔️',
  Leeds: '🦁', Leicester: '🦊', Sheffield: '⚙️', Coventry: '🌺',
  Luton: '✈️', Derby: '⚡', Nottingham: '🏹', Liverpool: '⚽',
  Edinburgh: '🏰', Glasgow: '🌉', Cardiff: '🐉', Bristol: '🚢',
};

const CATEGORY_ICONS: Record<string, string> = {
  'Mosque': '🕌',
  'Islamic Centre': '📚',
  'Madrasah': '✏️',
  'Musallah': '🤲',
  'Jamia Mosque': '🌙',
  'Central Mosque': '⭐',
};

export default async function Home() {
  const mosques = await getAllMosques();

  const cityCounts: Record<string, number> = {};
  mosques.forEach(m => {
    if (m.city && m.city !== 'Unknown' && m.city !== 'Unknown Area') {
      cityCounts[m.city] = (cityCounts[m.city] || 0) + 1;
    }
  });

  const topCities = Object.entries(cityCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 24);

  const categoryCounts: Record<string, number> = {};
  mosques.forEach(m => {
    if (m.category) {
      categoryCounts[m.category] = (categoryCounts[m.category] || 0) + 1;
    }
  });

  const totalMosques = mosques.length;
  const totalCities = Object.keys(cityCounts).length;

  return (
    <main style={{ minHeight: '100vh' }}>

      {/* ===== HERO ===== */}
      <header style={{
        background: 'linear-gradient(135deg, #082e20 0%, #0f4c35 40%, #1a6b4a 100%)',
        position: 'relative',
        overflow: 'hidden',
        paddingBottom: '60px',
      }}>
        {/* Decorative Islamic pattern overlay */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.06,
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />

        {/* Glowing orbs */}
        <div style={{
          position: 'absolute', top: '-100px', right: '-100px',
          width: '500px', height: '500px',
          background: 'radial-gradient(circle, rgba(200,168,75,0.15) 0%, transparent 70%)',
          borderRadius: '50%',
        }} />
        <div style={{
          position: 'absolute', bottom: '-80px', left: '-80px',
          width: '400px', height: '400px',
          background: 'radial-gradient(circle, rgba(45,138,97,0.2) 0%, transparent 70%)',
          borderRadius: '50%',
        }} />

        {/* Navbar */}
        <nav style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          maxWidth: '1200px', margin: '0 auto', padding: '20px 24px',
          position: 'relative', zIndex: 10,
        }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.8rem' }}>🕌</span>
            <span style={{
              fontSize: '1.25rem', fontWeight: '800', color: 'white',
              letterSpacing: '-0.02em'
            }}>
              Mosque<span style={{ color: '#c8a84b' }}>NearMe</span>
            </span>
          </Link>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <Link href="/about" style={{
              color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem', fontWeight: '500',
              padding: '8px 16px', borderRadius: '99px', transition: 'all 0.2s',
            }}>About</Link>
            <Link href="/contact" style={{
              color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem', fontWeight: '500',
              padding: '8px 16px', borderRadius: '99px', transition: 'all 0.2s',
            }}>Contact</Link>
            <Link href="#near-me" style={{
              background: '#c8a84b', color: 'white',
              padding: '10px 22px', borderRadius: '99px',
              fontSize: '0.9rem', fontWeight: '700',
              boxShadow: '0 4px 15px rgba(200,168,75,0.4)',
              transition: 'all 0.2s',
            }}>
              📍 Near Me
            </Link>
          </div>
        </nav>

        {/* Hero Content */}
        <div style={{
          maxWidth: '1200px', margin: '0 auto', padding: '60px 24px 0',
          textAlign: 'center', position: 'relative', zIndex: 10,
        }}>
          {/* Arabic decorative text */}
          <p style={{
            fontFamily: "'Amiri', serif", fontSize: '1.6rem', color: 'rgba(200,168,75,0.8)',
            marginBottom: '20px', letterSpacing: '0.05em',
          }}>
            بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ
          </p>

          <h1 style={{
            fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', fontWeight: '900',
            color: 'white', marginBottom: '20px', lineHeight: '1.1',
            letterSpacing: '-0.03em',
          }}>
            Find Your Nearest<br />
            <span style={{
              background: 'linear-gradient(135deg, #c8a84b, #e0c068)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              Mosque
            </span>{' '}
            in the UK
          </h1>

          <p style={{
            fontSize: '1.2rem', color: 'rgba(255,255,255,0.75)',
            maxWidth: '600px', margin: '0 auto 40px', lineHeight: '1.7',
          }}>
            Discover {totalMosques.toLocaleString()}+ mosques, prayer times & Islamic centres
            across {totalCities} cities in the United Kingdom & Ireland.
          </p>

          {/* Search */}
          <div style={{ maxWidth: '640px', margin: '0 auto', position: 'relative' }}>
            <div style={{
              background: 'rgba(255,255,255,0.1)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '16px',
              padding: '6px 6px 6px 20px',
              display: 'flex', alignItems: 'center', gap: '10px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
            }}>
              <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>🔍</span>
              <div style={{ flex: 1 }}>
                <SearchBox />
              </div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '24px', flexWrap: 'wrap' }}>
            <Link href="#near-me" style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              background: 'white', color: '#0f4c35',
              padding: '14px 28px', borderRadius: '99px',
              fontWeight: '700', fontSize: '1rem',
              boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
              transition: 'all 0.2s',
            }}>
              📍 Find Mosques Near Me
            </Link>
            <Link href="#cities" style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              background: 'rgba(255,255,255,0.15)',
              backdropFilter: 'blur(8px)',
              border: '1.5px solid rgba(255,255,255,0.4)',
              color: 'white',
              padding: '14px 28px', borderRadius: '99px',
              fontWeight: '600', fontSize: '1rem',
              transition: 'all 0.2s',
            }}>
              🏙️ Browse by City
            </Link>
          </div>

          {/* Stats Bar */}
          <div style={{
            display: 'flex', justifyContent: 'center', gap: '40px',
            marginTop: '60px', flexWrap: 'wrap',
          }}>
            {[
              { num: `${totalMosques.toLocaleString()}+`, label: 'Mosques Listed' },
              { num: `${totalCities}+`, label: 'Cities Covered' },
              { num: 'Free', label: 'Always Free to Use' },
              { num: '24/7', label: 'Prayer Times' },
            ].map(stat => (
              <div key={stat.label} style={{ textAlign: 'center' }}>
                <div style={{
                  fontSize: '2rem', fontWeight: '800', color: '#c8a84b',
                  lineHeight: '1',
                }}>
                  {stat.num}
                </div>
                <div style={{
                  fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)',
                  marginTop: '6px', fontWeight: '500',
                }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Wave divider */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, lineHeight: 0 }}>
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 60L60 50C120 40 240 20 360 15C480 10 600 20 720 28C840 36 960 42 1080 40C1200 38 1320 28 1380 23L1440 18V60H0Z" fill="#f7f8f5"/>
          </svg>
        </div>
      </header>

      {/* ===== NEAR ME SECTION ===== */}
      <NearMeSection />

      {/* Ad */}
      <div className="container" style={{ padding: '20px 24px' }}>
        <AdBanner slot="9036536622" format="autorelaxed" />
      </div>

      {/* ===== CITIES SECTION ===== */}
      <section id="cities" style={{ padding: '80px 0', background: '#f7f8f5' }}>
        <div className="container">
          {/* Section Header */}
          <div style={{ textAlign: 'center', marginBottom: '50px' }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              background: 'rgba(15,76,53,0.08)', color: '#0f4c35',
              padding: '6px 16px', borderRadius: '99px',
              fontSize: '0.85rem', fontWeight: '700', letterSpacing: '0.04em',
              textTransform: 'uppercase', marginBottom: '16px',
            }}>
              🏙️ Locations
            </span>
            <h2 style={{
              fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: '800',
              color: '#111827', marginBottom: '14px', letterSpacing: '-0.03em',
            }}>
              Browse Mosques by City
            </h2>
            <p style={{ color: '#6b7280', fontSize: '1.1rem', maxWidth: '500px', margin: '0 auto' }}>
              Explore Islamic centres, prayer times & facilities across the UK & Ireland.
            </p>
          </div>

          {/* City Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: '16px',
          }}>
            {topCities.map(([city, count], i) => (
              <Link
                key={city}
                href={`/cities/${generateSlug(city)}`}
                style={{
                  display: 'flex', flexDirection: 'column',
                  background: 'white',
                  borderRadius: '14px',
                  border: '1px solid #e5e7eb',
                  padding: '24px 20px',
                  transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
                  textDecoration: 'none',
                  position: 'relative',
                  overflow: 'hidden',
                }}
                className="city-card"
              >
                {/* Top accent bar */}
                {i < 6 && (
                  <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0,
                    height: '3px',
                    background: 'linear-gradient(90deg, #0f4c35, #2d8a61)',
                  }} />
                )}
                <div style={{ fontSize: '2rem', marginBottom: '10px' }}>
                  {CITY_ICONS[city] || '🕌'}
                </div>
                <h3 style={{
                  fontSize: '1.1rem', fontWeight: '700', color: '#111827',
                  marginBottom: '6px',
                }}>
                  {city}
                </h3>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: '500' }}>
                  {count} mosque{count !== 1 ? 's' : ''}
                </p>
                <div style={{
                  marginTop: 'auto', paddingTop: '14px',
                  display: 'flex', alignItems: 'center', gap: '4px',
                  fontSize: '0.85rem', color: '#0f4c35', fontWeight: '600',
                }}>
                  View all →
                </div>
              </Link>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: '40px' }}>
            <Link href="/cities" style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              background: '#0f4c35', color: 'white',
              padding: '14px 32px', borderRadius: '99px',
              fontWeight: '700', fontSize: '1rem',
              boxShadow: '0 4px 20px rgba(15,76,53,0.25)',
              transition: 'all 0.2s',
            }}>
              View All {totalCities} Cities →
            </Link>
          </div>
        </div>
      </section>

      {/* Ad */}
      <div className="container" style={{ padding: '10px 24px' }}>
        <AdBanner slot="3082530032" />
      </div>

      {/* ===== CATEGORIES ===== */}
      <section style={{ padding: '80px 0', background: 'white' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '50px' }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              background: 'rgba(200,168,75,0.1)', color: '#a08235',
              padding: '6px 16px', borderRadius: '99px',
              fontSize: '0.85rem', fontWeight: '700', letterSpacing: '0.04em',
              textTransform: 'uppercase', marginBottom: '16px',
            }}>
              🏛️ Categories
            </span>
            <h2 style={{
              fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: '800',
              color: '#111827', marginBottom: '14px', letterSpacing: '-0.03em',
            }}>
              Browse by Type
            </h2>
            <p style={{ color: '#6b7280', fontSize: '1.1rem', maxWidth: '500px', margin: '0 auto' }}>
              Find the right Islamic facility for your needs — from mosques to madrasahs.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '20px',
          }}>
            {Object.entries(categoryCounts).map(([category, count]) => (
              <Link
                key={category}
                href={`/categories/${generateSlug(category)}`}
                style={{
                  display: 'flex', alignItems: 'center', gap: '16px',
                  background: 'white',
                  border: '1.5px solid #e5e7eb',
                  borderRadius: '14px',
                  padding: '20px 24px',
                  transition: 'all 0.25s',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
                }}
                className="category-card"
              >
                <div style={{
                  width: '52px', height: '52px', flexShrink: 0,
                  background: 'linear-gradient(135deg, #0f4c35, #1a6b4a)',
                  borderRadius: '12px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.5rem',
                  boxShadow: '0 4px 12px rgba(15,76,53,0.2)',
                }}>
                  {CATEGORY_ICONS[category] || '🕌'}
                </div>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#111827', marginBottom: '3px' }}>
                    {category}
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: '#6b7280', fontWeight: '500' }}>
                    {count} location{count !== 1 ? 's' : ''}
                  </p>
                </div>
                <span style={{ marginLeft: 'auto', color: '#9ca3af', fontSize: '1.2rem' }}>›</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FEATURES STRIP ===== */}
      <section style={{
        background: 'linear-gradient(135deg, #082e20, #0f4c35)',
        padding: '70px 0',
      }}>
        <div className="container">
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '40px',
          }}>
            {[
              { icon: '🕐', title: 'Live Prayer Times', desc: 'Accurate prayer times calculated daily based on your location and the mosque\'s coordinates.' },
              { icon: '📍', title: 'GPS Near Me', desc: 'Instantly find the closest mosque to your current location with our interactive map.' },
              { icon: '🏛️', title: 'Full Facilities Info', desc: 'Know before you go — wudu, parking, women\'s area, wheelchair access & more.' },
              { icon: '🔍', title: 'Powerful Search', desc: 'Search by name, city, postcode or category to find exactly what you need.' },
            ].map(f => (
              <div key={f.title} style={{ textAlign: 'center', padding: '20px' }}>
                <div style={{
                  fontSize: '2.5rem', marginBottom: '16px',
                  filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))',
                }}>
                  {f.icon}
                </div>
                <h3 style={{ color: 'white', fontSize: '1.15rem', fontWeight: '700', marginBottom: '10px' }}>
                  {f.title}
                </h3>
                <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.9rem', lineHeight: '1.6' }}>
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <style>{`
        .city-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 30px rgba(15,76,53,0.12) !important;
          border-color: rgba(15,76,53,0.2) !important;
        }
        .category-card:hover {
          transform: translateY(-3px);
          border-color: #0f4c35 !important;
          box-shadow: 0 8px 24px rgba(15,76,53,0.12) !important;
        }
      `}</style>
    </main>
  );
}
