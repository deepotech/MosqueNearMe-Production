import { Suspense } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import DonationForm from '@/components/DonationForm';
import { SITE_BASE_URL } from '@/lib/seo/constants';

export const metadata: Metadata = {
  title: 'Support a Mosque - Secure Donations | MosqueNearMe',
  description:
    'Support a mosque and its local community through MosqueNearMe. Choose any UK mosque and make a secure donation via PayPal.',
  alternates: {
    canonical: `${SITE_BASE_URL}/donate/`,
  },
  openGraph: {
    title: 'Support a Mosque - Secure Donations | MosqueNearMe',
    description:
      'Support a mosque and its local community through MosqueNearMe. Choose any UK mosque and make a secure donation via PayPal.',
    url: `${SITE_BASE_URL}/donate/`,
    siteName: 'Mosque Near Me',
    type: 'website',
  },
};

const FAQS = [
  {
    q: 'How do I donate to a mosque?',
    a: 'Search for any mosque across the UK using its name, city, or postcode, choose your donation amount, and complete your payment securely with PayPal. Your donation is immediately recorded and linked to your chosen mosque.',
  },
  {
    q: 'Can I choose which mosque receives my donation?',
    a: 'Yes, mosque selection is mandatory before donating. Every single donation is permanently tagged with the selected mosque ID and name.',
  },
  {
    q: 'Can I donate anonymously?',
    a: 'Yes. Check the "Donate anonymously" option on the form. Your personal details will not be displayed on public receipts.',
  },
  {
    q: 'Can I make a monthly donation?',
    a: 'Yes, you can toggle between One-Time and Monthly donation frequency. Recurring donations are processed securely through PayPal.',
  },
  {
    q: 'How is my donation processed?',
    a: 'Payments are processed through MosqueNearMe’s central PayPal account. Our backend logs each transaction to the selected mosque’s balance ledger so payouts can be tracked and transferred directly to the mosque.',
  },
  {
    q: 'Can I cancel a donation?',
    a: 'Before finalizing in PayPal, you can cancel at any time. For completed donations, please contact MosqueNearMe support with your Donation Reference ID.',
  },
  {
    q: 'Where can I see my donation receipt?',
    a: 'Immediately after completing payment, you will receive an on-screen confirmation with your unique Donation ID and transaction reference. PayPal also emails an official payment receipt.',
  },
];

export default function DonatePage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        name: 'Support a Mosque',
        url: `${SITE_BASE_URL}/donate/`,
        description: 'Support a mosque and its local community through MosqueNearMe.',
      },
      {
        '@type': 'FAQPage',
        mainEntity: FAQS.map((faq) => ({
          '@type': 'Question',
          name: faq.q,
          acceptedAnswer: {
            '@type': 'Answer',
            text: faq.a,
          },
        })),
      },
    ],
  };

  return (
    <div style={{ background: '#f7f8f5', minHeight: '100vh', paddingBottom: '80px' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ── HERO HEADER ── */}
      <div
        style={{
          background: 'linear-gradient(135deg, #082e20 0%, #0f4c35 60%, #1a6b4a 100%)',
          padding: '40px 0 60px',
          color: 'white',
          position: 'relative',
        }}
      >
        <div className="container" style={{ maxWidth: '800px', textAlign: 'center' }}>
          {/* Breadcrumb */}
          <nav
            style={{
              fontSize: '0.85rem',
              display: 'flex',
              gap: '6px',
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: '20px',
            }}
          >
            <Link href="/" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}>
              Home
            </Link>
            <span style={{ color: 'rgba(255,255,255,0.3)' }}>›</span>
            <span style={{ color: 'rgba(255,255,255,0.9)' }}>Donate</span>
          </nav>

          <span
            style={{
              background: 'rgba(200,168,75,0.25)',
              color: '#e0c068',
              border: '1px solid rgba(200,168,75,0.4)',
              padding: '4px 14px',
              borderRadius: '99px',
              fontSize: '0.85rem',
              fontWeight: '700',
              display: 'inline-block',
              marginBottom: '14px',
            }}
          >
            🤲 Support Your Local Mosque
          </span>

          <h1
            style={{
              fontSize: 'clamp(2rem, 5vw, 3rem)',
              fontWeight: '900',
              marginBottom: '16px',
              letterSpacing: '-0.02em',
            }}
          >
            Support a Mosque
          </h1>

          <p
            style={{
              fontSize: '1.1rem',
              color: 'rgba(255,255,255,0.85)',
              lineHeight: '1.7',
              margin: '0 auto',
              maxWidth: '620px',
            }}
          >
            Choose a mosque and make a donation through MosqueNearMe. Your selected mosque is
            recorded with the donation so that donations can be tracked by mosque.
          </p>
        </div>
      </div>

      {/* ── DONATION FORM WRAPPER ── */}
      <div className="container" style={{ marginTop: '-30px', position: 'relative', zIndex: 10 }}>
        <Suspense
          fallback={
            <div
              style={{
                maxWidth: '680px',
                margin: '0 auto',
                background: 'white',
                borderRadius: '16px',
                padding: '40px',
                textAlign: 'center',
                boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
              }}
            >
              Loading donation options...
            </div>
          }
        >
          <DonationForm />
        </Suspense>
      </div>

      {/* ── HOW IT WORKS SECTION ── */}
      <div className="container" style={{ maxWidth: '900px', marginTop: '70px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h2 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#111827', margin: '0 0 8px' }}>
            How It Works
          </h2>
          <p style={{ color: '#4b5563', fontSize: '1rem', margin: 0 }}>
            Simple, secure, and transparent community giving in 4 easy steps.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '20px',
          }}
        >
          {[
            {
              step: '1',
              title: 'Choose a Mosque',
              desc: 'Search our directory of over 2,180 UK mosques by name, city, or postcode.',
            },
            {
              step: '2',
              title: 'Select Amount',
              desc: 'Choose from suggested amounts (£5, £10, £25, £50) or type in a custom amount.',
            },
            {
              step: '3',
              title: 'Pay with PayPal',
              desc: 'Complete your donation securely using your PayPal account or card.',
            },
            {
              step: '4',
              title: 'Tracked & Recorded',
              desc: 'Your donation is logged to the chosen mosque’s ledger for transparent payout.',
            },
          ].map((item) => (
            <div
              key={item.step}
              style={{
                background: 'white',
                borderRadius: '14px',
                padding: '24px 20px',
                border: '1px solid #e5e7eb',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              }}
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: '#0f4c35',
                  color: 'white',
                  fontWeight: '800',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '14px',
                  fontSize: '0.95rem',
                }}
              >
                {item.step}
              </div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#111827', marginBottom: '8px' }}>
                {item.title}
              </h3>
              <p style={{ color: '#4b5563', fontSize: '0.88rem', lineHeight: '1.6', margin: 0 }}>
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── FAQ SECTION ── */}
      <div className="container" style={{ maxWidth: '800px', marginTop: '70px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h2 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#111827', margin: '0 0 8px' }}>
            Frequently Asked Questions
          </h2>
          <p style={{ color: '#4b5563', fontSize: '1rem', margin: 0 }}>
            Everything you need to know about donating through MosqueNearMe.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {FAQS.map((faq, i) => (
            <details
              key={i}
              style={{
                background: 'white',
                borderRadius: '12px',
                border: '1px solid #e5e7eb',
                padding: '16px 20px',
                boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
              }}
            >
              <summary
                style={{
                  fontWeight: '700',
                  color: '#111827',
                  fontSize: '0.98rem',
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                {faq.q}
              </summary>
              <p
                style={{
                  color: '#4b5563',
                  fontSize: '0.92rem',
                  lineHeight: '1.6',
                  marginTop: '12px',
                  marginBottom: 0,
                }}
              >
                {faq.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}
