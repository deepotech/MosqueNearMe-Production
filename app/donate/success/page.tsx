import { Suspense } from 'react';
import type { Metadata } from 'next';
import SuccessDetails from './SuccessDetails';

export const metadata: Metadata = {
  title: 'Thank You for Your Donation | MosqueNearMe',
  robots: {
    index: false,
    follow: false,
  },
};

export default function DonationSuccessPage() {
  return (
    <div style={{ background: '#f7f8f5', minHeight: '100vh', padding: '20px 24px' }}>
      <Suspense
        fallback={
          <div
            style={{
              maxWidth: '560px',
              margin: '60px auto',
              background: 'white',
              borderRadius: '16px',
              border: '1px solid #e5e7eb',
              padding: '48px 32px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '1.8rem', marginBottom: '12px' }}>⏳</div>
            <strong style={{ color: '#111827', fontSize: '1.05rem', display: 'block' }}>
              Loading confirmation...
            </strong>
          </div>
        }
      >
        <SuccessDetails />
      </Suspense>
    </div>
  );
}
