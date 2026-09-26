import Link from 'next/link';
import type { Metadata } from 'next';
import { buildNotFoundMetadata } from '@/lib/seo/metadata';
import { SITE_BASE_URL } from '@/lib/seo/constants';

export const metadata: Metadata = buildNotFoundMetadata();

export default function NotFound() {
  return (
    <div style={{
      background: 'linear-gradient(135deg, #082e20 0%, #0f4c35 60%, #1a6b4a 100%)',
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px', fontFamily: 'var(--font-geist-sans), system-ui, sans-serif',
    }}>
      {/* Ensure noindex via headers for static export */}
      <meta name="robots" content="noindex, nofollow" />

      <div style={{
        background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.15)', borderRadius: '24px',
        padding: '60px 48px', textAlign: 'center', maxWidth: '520px', width: '100%',
      }}>
        <div style={{ fontSize: '4rem', marginBottom: '16px' }}>🕌</div>

        <h1 style={{
          fontSize: 'clamp(1.8rem, 4vw, 2.4rem)', fontWeight: '900',
          color: 'white', marginBottom: '12px', letterSpacing: '-0.03em',
        }}>
          Page Not Found
        </h1>

        <p style={{
          color: 'rgba(255,255,255,0.65)', fontSize: '1rem',
          lineHeight: '1.6', marginBottom: '36px',
        }}>
          The mosque page you&apos;re looking for doesn&apos;t exist or may have moved.
          Use the links below to find what you need.
        </p>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link href="/" style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            background: 'linear-gradient(135deg, #c8a84b, #e6c060)',
            color: '#082e20', padding: '12px 24px', borderRadius: '99px',
            fontWeight: '700', fontSize: '0.95rem', textDecoration: 'none',
          }}>
            🏠 Go Home
          </Link>
          <Link href="/search" style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.9)',
            border: '1.5px solid rgba(255,255,255,0.25)',
            padding: '12px 24px', borderRadius: '99px',
            fontWeight: '600', fontSize: '0.95rem', textDecoration: 'none',
          }}>
            🔍 Search Mosques
          </Link>
          <Link href="/near-me" style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.9)',
            border: '1.5px solid rgba(255,255,255,0.25)',
            padding: '12px 24px', borderRadius: '99px',
            fontWeight: '600', fontSize: '0.95rem', textDecoration: 'none',
          }}>
            📍 Near Me
          </Link>
        </div>

        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.8rem', marginTop: '32px' }}>
          HTTP 404 · {SITE_BASE_URL}
        </p>
      </div>
    </div>
  );
}
