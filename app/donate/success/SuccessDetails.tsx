'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { captureDonationOrder, getDonationDetails } from '@/lib/donations-client';

interface VerifiedDonation {
  donationId: string;
  mosqueName: string;
  amount: number | string;
  currency: string;
  captureId?: string;
  alreadyProcessed?: boolean;
}

export default function SuccessDetails() {
  const searchParams = useSearchParams();
  const [state, setState] = useState<'verifying' | 'completed' | 'error'>('verifying');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [details, setDetails] = useState<VerifiedDonation | null>(null);

  const hasExecutedRef = useRef(false);

  useEffect(() => {
    if (hasExecutedRef.current) return;
    hasExecutedRef.current = true;

    async function verifyAndCapture() {
      const token = searchParams.get('token') || searchParams.get('orderId');
      const queryId = searchParams.get('id');
      const queryRef = searchParams.get('ref');

      let storedId: string | null = null;
      let storedMosque: string | null = null;
      let storedAmount: string | null = null;

      if (typeof window !== 'undefined') {
        storedId = sessionStorage.getItem('pending_donation_id');
        storedMosque = sessionStorage.getItem('pending_mosque_name');
        storedAmount = sessionStorage.getItem('pending_amount');
      }

      const effectiveDonationId = queryId || storedId;

      // 1. Returning from PayPal checkout redirect (token present)
      if (token) {
        try {
          const res = await captureDonationOrder(effectiveDonationId, token);
          if (res.success && res.status === 'COMPLETED') {
            if (typeof window !== 'undefined') {
              sessionStorage.removeItem('pending_donation_id');
              sessionStorage.removeItem('pending_mosque_name');
              sessionStorage.removeItem('pending_amount');
            }
            setDetails({
              donationId: res.donationId,
              mosqueName: res.mosqueName || storedMosque || 'Selected Mosque',
              amount: res.amount || storedAmount || '0.00',
              currency: res.currency || 'GBP',
              captureId: res.captureId,
              alreadyProcessed: res.alreadyProcessed,
            });
            setState('completed');
            return;
          } else {
            throw new Error(res.error || 'Payment was not marked as completed by PayPal.');
          }
        } catch (err: unknown) {
          console.error('PayPal capture verification error:', err);
          const msg = err instanceof Error ? err.message : 'Payment could not be verified by the server.';
          setErrorMessage(msg);
          setState('error');
          return;
        }
      }

      // 2. Direct lookup with Donation ID (?id=MNM-DON-...)
      if (queryId) {
        try {
          const donation = await getDonationDetails(queryId);
          if (donation && donation.status === 'COMPLETED') {
            setDetails({
              donationId: donation.id,
              mosqueName: donation.mosqueName || searchParams.get('mosque') || 'Selected Mosque',
              amount: donation.amount || searchParams.get('amount') || '0.00',
              currency: donation.currency || 'GBP',
              captureId: queryRef || donation.id,
            });
            setState('completed');
            return;
          } else {
            throw new Error('Donation record is not completed or not found.');
          }
        } catch (err: unknown) {
          console.error('Donation lookup error:', err);
          setErrorMessage('Could not verify donation record with the backend.');
          setState('error');
          return;
        }
      }


      // 3. Neither token nor valid ID found
      setErrorMessage('No payment reference found. If you completed a payment, please check your PayPal receipt.');
      setState('error');
    }

    verifyAndCapture();
  }, [searchParams]);

  // ── Render: Verifying State ──
  if (state === 'verifying') {
    return (
      <div
        style={{
          maxWidth: '560px',
          margin: '60px auto',
          background: 'white',
          borderRadius: '16px',
          border: '1px solid #e5e7eb',
          padding: '48px 32px',
          textAlign: 'center',
          boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: '#fef3c7',
            color: '#92400e',
            fontSize: '1.8rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
          }}
        >
          ⏳
        </div>
        <span
          style={{
            background: '#fef3c7',
            color: '#92400e',
            border: '1px solid #fde68a',
            padding: '4px 12px',
            borderRadius: '99px',
            fontSize: '0.8rem',
            fontWeight: '700',
            display: 'inline-block',
            marginBottom: '12px',
          }}
        >
          Verifying with PayPal
        </span>
        <h1 style={{ fontSize: '1.6rem', fontWeight: '800', color: '#111827', margin: '0 0 10px' }}>
          Confirming Your Donation
        </h1>
        <p style={{ color: '#4b5563', fontSize: '0.95rem', lineHeight: '1.6', margin: '0 0 24px' }}>
          Please hold on while we capture the PayPal order and record your donation in the mosque ledger.
        </p>
      </div>
    );
  }

  // ── Render: Error State ──
  if (state === 'error') {
    return (
      <div
        style={{
          maxWidth: '560px',
          margin: '60px auto',
          background: 'white',
          borderRadius: '16px',
          border: '1px solid #fecaca',
          padding: '40px 32px',
          textAlign: 'center',
          boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: '#fee2e2',
            color: '#991b1b',
            fontSize: '2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
          }}
        >
          ✕
        </div>
        <span
          style={{
            background: '#fee2e2',
            color: '#991b1b',
            border: '1px solid #fca5a5',
            padding: '4px 12px',
            borderRadius: '99px',
            fontSize: '0.8rem',
            fontWeight: '700',
            display: 'inline-block',
            marginBottom: '12px',
          }}
        >
          Payment Not Confirmed
        </span>
        <h1 style={{ fontSize: '1.6rem', fontWeight: '800', color: '#111827', margin: '0 0 10px' }}>
          Verification Incomplete
        </h1>
        <p style={{ color: '#4b5563', fontSize: '0.95rem', lineHeight: '1.6', margin: '0 0 28px' }}>
          {errorMessage}
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Link
            href="/donate"
            style={{
              display: 'block',
              padding: '14px',
              background: '#0f4c35',
              color: 'white',
              borderRadius: '10px',
              fontWeight: '700',
              fontSize: '0.98rem',
              textDecoration: 'none',
            }}
          >
            Try Again
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
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  // ── Render: Verified Completed State ──
  return (
    <div
      style={{
        maxWidth: '560px',
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
          background: '#d1fae5',
          color: '#065f46',
          fontSize: '2.4rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px',
        }}
      >
        ✓
      </div>

      <span
        style={{
          background: '#f0fdf4',
          color: '#065f46',
          border: '1px solid #86efac',
          padding: '4px 12px',
          borderRadius: '99px',
          fontSize: '0.8rem',
          fontWeight: '700',
          display: 'inline-block',
          marginBottom: '12px',
        }}
      >
        Payment Verified &amp; Completed
      </span>

      <h1 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#111827', margin: '0 0 10px' }}>
        Thank You for Your Donation
      </h1>

      <p style={{ color: '#4b5563', fontSize: '1rem', lineHeight: '1.6', margin: '0 0 28px' }}>
        Your donation has been verified by PayPal and recorded in the mosque ledger.
      </p>

      {/* Details Box */}
      <div
        style={{
          background: '#f9fafb',
          border: '1px solid #e5e7eb',
          borderRadius: '12px',
          padding: '20px',
          textAlign: 'left',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#6b7280', fontSize: '0.88rem' }}>Mosque</span>
          <strong style={{ color: '#111827', fontSize: '0.95rem' }}>{details?.mosqueName}</strong>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#6b7280', fontSize: '0.88rem' }}>Amount Donated</span>
          <strong style={{ color: '#0f4c35', fontSize: '1.15rem' }}>
            £{typeof details?.amount === 'number' ? details.amount.toFixed(2) : details?.amount}
          </strong>
        </div>

        {details?.captureId && (
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#6b7280', fontSize: '0.88rem' }}>PayPal Capture Reference</span>
            <code style={{ background: '#e5e7eb', padding: '2px 8px', borderRadius: '4px', fontSize: '0.82rem' }}>
              {details.captureId}
            </code>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#6b7280', fontSize: '0.88rem' }}>Donation ID</span>
          <code style={{ background: '#e5e7eb', padding: '2px 8px', borderRadius: '4px', fontSize: '0.82rem' }}>
            {details?.donationId}
          </code>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          marginTop: '32px',
        }}
      >
        <Link
          href="/"
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
          Return to MosqueNearMe
        </Link>
        <Link
          href="/donate"
          style={{
            display: 'block',
            padding: '12px',
            background: 'white',
            color: '#0f4c35',
            border: '1.5px solid #0f4c35',
            borderRadius: '10px',
            fontWeight: '600',
            fontSize: '0.95rem',
            textDecoration: 'none',
          }}
        >
          Support Another Mosque
        </Link>
      </div>
    </div>
  );
}
