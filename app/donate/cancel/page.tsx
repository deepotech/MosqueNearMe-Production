import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Donation Cancelled | MosqueNearMe',
  robots: {
    index: false,
    follow: false,
  },
};

export default function DonationCancelPage() {
  return (
    <div style={{ background: '#f7f8f5', minHeight: '100vh', padding: '20px 24px' }}>
      <div
        style={{
          maxWidth: '520px',
          margin: '60px auto',
          background: 'white',
          borderRadius: '16px',
          border: '1px solid #e5e7eb',
          padding: '40px 32px',
          textAlign: 'center',
          boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
        }}
      >
        <div
          style={{
            width: '72px',
            height: '72px',
            borderRadius: '50%',
            background: '#fee2e2',
            color: '#dc2626',
            fontSize: '2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
          }}
        >
          ✕
        </div>

        <h1 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#111827', margin: '0 0 10px' }}>
          Your Donation Was Cancelled
        </h1>

        <p style={{ color: '#4b5563', fontSize: '1rem', lineHeight: '1.6', margin: '0 0 28px' }}>
          You have not completed the donation and no payment was charged. You can return to the
          donation page whenever you are ready.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Link
            href="/donate"
            style={{
              display: 'block',
              padding: '14px',
              background: 'linear-gradient(135deg, #0f4c35, #1a6b4a)',
              color: 'white',
              borderRadius: '10px',
              fontWeight: '700',
              fontSize: '0.98rem',
              textDecoration: 'none',
              boxShadow: '0 4px 12px rgba(15,76,53,0.2)',
            }}
          >
            Return to Donation Page
          </Link>

          <Link
            href="/"
            style={{
              display: 'block',
              padding: '12px',
              background: 'white',
              color: '#4b5563',
              border: '1px solid #d1d5db',
              borderRadius: '10px',
              fontWeight: '600',
              fontSize: '0.95rem',
              textDecoration: 'none',
            }}
          >
            Return to MosqueNearMe
          </Link>
        </div>
      </div>
    </div>
  );
}
