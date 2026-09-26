'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Mosque } from '@/lib/types';
import { createDonationOrder, captureDonationOrder } from '@/lib/donations-client';

const SUGGESTED_AMOUNTS = [5, 10, 25, 50];
const MIN_AMOUNT = 1;
const MAX_AMOUNT = 5000;

export default function DonationForm() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Mosque search & selection state
  const [allMosques, setAllMosques] = useState<Mosque[]>([]);
  const [loadingMosques, setLoadingMosques] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMosque, setSelectedMosque] = useState<Mosque | null>(null);

  // Donation state
  const [amount, setAmount] = useState<number>(25);
  const [customAmountStr, setCustomAmountStr] = useState<string>('');
  const [isCustom, setIsCustom] = useState(false);
  const [donationType, setDonationType] = useState<'ONE_TIME' | 'MONTHLY'>('ONE_TIME');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [donorName, setDonorName] = useState('');
  const [donorEmail, setDonorEmail] = useState('');

  // Processing & UI state
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 1. Fetch mosques dataset client-side
  useEffect(() => {
    fetch('/mosques.json')
      .then((res) => res.json())
      .then((data: Mosque[]) => {
        setAllMosques(data);
        setLoadingMosques(false);

        // Pre-select mosque if query param exists
        const mosqueParam = searchParams.get('mosque');
        if (mosqueParam) {
          const match = data.find(
            (m) =>
              m.slug.toLowerCase() === mosqueParam.toLowerCase() ||
              m.id.toLowerCase() === mosqueParam.toLowerCase()
          );
          if (match) {
            setSelectedMosque(match);
          }
        }
      })
      .catch((err) => {
        console.error('Failed to load mosques list:', err);
        setLoadingMosques(false);
      });
  }, [searchParams]);

  // 2. Filter mosques based on query
  const filteredMosques = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return allMosques
      .filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.city.toLowerCase().includes(q) ||
          m.postcode.toLowerCase().includes(q)
      )
      .slice(0, 10);
  }, [allMosques, searchQuery]);

  // 3. Amount selection handler
  const handleAmountClick = (val: number) => {
    setIsCustom(false);
    setAmount(val);
    setCustomAmountStr('');
    setErrorMessage(null);
  };

  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomAmountStr(val);
    setIsCustom(true);
    const parsed = parseFloat(val);
    if (!isNaN(parsed) && parsed > 0) {
      setAmount(parsed);
      setErrorMessage(null);
    }
  };

  // 4. Validate before PayPal Checkout
  const validateForm = (): boolean => {
    if (!selectedMosque) {
      setErrorMessage('Please search and select a mosque before donating.');
      return false;
    }
    if (isNaN(amount) || amount < MIN_AMOUNT) {
      setErrorMessage(`The minimum donation amount is £${MIN_AMOUNT}.00.`);
      return false;
    }
    if (amount > MAX_AMOUNT) {
      setErrorMessage(`The maximum donation amount is £${MAX_AMOUNT.toLocaleString()}.00.`);
      return false;
    }
    return true;
  };

  // PayPal architecture note:
  // This form uses the backend redirect flow:
  //   1. POST /api/donations/create-order → backend creates PayPal order, returns approveUrl
  //   2. User is redirected to PayPal to approve
  //   3. POST /api/donations/capture-order → backend captures payment server-side
  //
  // No PayPal JS SDK is loaded in the frontend (no NEXT_PUBLIC_PAYPAL_CLIENT_ID needed).
  // PayPal Client Secret lives exclusively in the backend .env.


  // Handle PayPal redirect flow:
  //   1. Create order in backend → get approveUrl
  //   2. Redirect user to PayPal to approve
  //   3. PayPal redirects back to /donate/success?token=<orderId>&donationId=<id>
  //   4. Success page calls backend capture-order — NEVER trust redirect alone
  const handleDirectDonate = async () => {
    if (!validateForm()) return;
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const order = await createDonationOrder({
        mosqueId: selectedMosque!.id,
        mosqueSlug: selectedMosque!.slug,
        mosqueName: selectedMosque!.name,
        amount,
        donationType,
        isAnonymous,
        donorName: isAnonymous ? undefined : donorName,
        donorEmail: isAnonymous ? undefined : donorEmail,
      });

      if (!order.approveUrl) {
        throw new Error('Failed to get PayPal approval URL. Please try again.');
      }

      // For mock/sandbox orders without a real approveUrl, capture immediately
      // In production with real PayPal credentials, approveUrl redirects to PayPal.
      if (order.approveUrl.startsWith('/donate/')) {
        // Sandbox mock flow: capture directly then redirect to success
        const capture = await captureDonationOrder(order.donationId, order.paypalOrderId);
        if (capture.success) {
          router.push(
            `/donate/success?id=${encodeURIComponent(capture.donationId)}&mosque=${encodeURIComponent(
              selectedMosque!.name
            )}&amount=${amount.toFixed(2)}&ref=${encodeURIComponent(capture.captureId || capture.donationId)}`
          );
        } else {
          throw new Error('Payment capture was not completed.');
        }
      } else {
        // Production flow: redirect to PayPal — capture happens on return via success page
        // Store donationId in sessionStorage for the success page to retrieve
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('pending_donation_id', order.donationId);
          sessionStorage.setItem('pending_mosque_name', selectedMosque!.name);
          sessionStorage.setItem('pending_amount', amount.toFixed(2));
        }
        window.location.href = order.approveUrl;
      }
    } catch (err: unknown) {
      console.error('Donation failed:', err);
      const msg = err instanceof Error ? err.message : 'Payment could not be completed. Please try again.';
      setErrorMessage(msg);
      setIsProcessing(false);
    }
  };


  return (
    <div style={{ maxWidth: '680px', margin: '0 auto' }}>
      {/* ── CARD CONTAINER ── */}
      <div
        style={{
          background: 'white',
          borderRadius: '16px',
          border: '1px solid #e5e7eb',
          boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
          overflow: 'hidden',
        }}
      >
        {/* Card Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, #082e20 0%, #0f4c35 100%)',
            padding: '24px 28px',
            color: 'white',
          }}
        >
          <span
            style={{
              display: 'inline-block',
              background: 'rgba(200,168,75,0.25)',
              color: '#e0c068',
              border: '1px solid rgba(200,168,75,0.4)',
              padding: '3px 12px',
              borderRadius: '99px',
              fontSize: '0.8rem',
              fontWeight: '700',
              marginBottom: '10px',
            }}
          >
            🕌 Centralized PayPal Support
          </span>
          <h2 style={{ fontSize: '1.4rem', fontWeight: '800', margin: '0 0 6px' }}>
            Choose Mosque &amp; Donation Amount
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.9rem', margin: 0 }}>
            All donations are processed securely via MosqueNearMe and linked to your selected mosque.
          </p>
        </div>

        <div style={{ padding: '28px' }}>
          {/* ── STEP 1: MOSQUE SELECTION ── */}
          <div style={{ marginBottom: '28px' }}>
            <label
              style={{
                display: 'block',
                fontWeight: '700',
                color: '#111827',
                fontSize: '0.95rem',
                marginBottom: '8px',
              }}
            >
              1. Select Mosque <span style={{ color: '#dc2626' }}>*</span>
            </label>

            {selectedMosque ? (
              <div
                style={{
                  background: '#f0fdf4',
                  border: '1.5px solid #86efac',
                  borderRadius: '12px',
                  padding: '16px 20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '1.2rem' }}>🕌</span>
                    <strong style={{ color: '#065f46', fontSize: '1.05rem' }}>
                      {selectedMosque.name}
                    </strong>
                  </div>
                  <p style={{ margin: '4px 0 0', color: '#4b5563', fontSize: '0.85rem' }}>
                    📍 {selectedMosque.city} {selectedMosque.postcode ? `• ${selectedMosque.postcode}` : ''}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedMosque(null);
                    setSearchQuery('');
                  }}
                  style={{
                    background: 'white',
                    border: '1px solid #d1d5db',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    color: '#374151',
                    cursor: 'pointer',
                  }}
                >
                  Change
                </button>
              </div>
            ) : (
              <div>
                <input
                  type="text"
                  placeholder={loadingMosques ? 'Loading mosques list...' : 'Search by mosque name, city, or postcode...'}
                  disabled={loadingMosques}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    borderRadius: '10px',
                    border: '1.5px solid #d1d5db',
                    fontSize: '0.95rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />

                {filteredMosques.length > 0 && (
                  <div
                    style={{
                      marginTop: '8px',
                      background: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '10px',
                      boxShadow: '0 10px 25px rgba(0,0,0,0.08)',
                      maxHeight: '260px',
                      overflowY: 'auto',
                    }}
                  >
                    {filteredMosques.map((m) => (
                      <div
                        key={m.id}
                        onClick={() => {
                          setSelectedMosque(m);
                          setSearchQuery('');
                        }}
                        style={{
                          padding: '12px 16px',
                          borderBottom: '1px solid #f3f4f6',
                          cursor: 'pointer',
                          transition: 'background 0.15s',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#f9fafb')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'white')}
                      >
                        <strong style={{ color: '#111827', fontSize: '0.92rem' }}>{m.name}</strong>
                        <div style={{ color: '#6b7280', fontSize: '0.82rem', marginTop: '2px' }}>
                          📍 {m.city} {m.address ? `• ${m.address}` : ''}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <small style={{ color: '#6b7280', marginTop: '6px', display: 'block' }}>
                  Search any of the 2,180+ verified mosques across the UK.
                </small>
              </div>
            )}
          </div>

          {/* ── STEP 2: DONATION AMOUNT ── */}
          <div style={{ marginBottom: '28px' }}>
            <label
              style={{
                display: 'block',
                fontWeight: '700',
                color: '#111827',
                fontSize: '0.95rem',
                marginBottom: '10px',
              }}
            >
              2. Donation Amount (GBP £) <span style={{ color: '#dc2626' }}>*</span>
            </label>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '10px',
                marginBottom: '14px',
              }}
            >
              {SUGGESTED_AMOUNTS.map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleAmountClick(val)}
                  style={{
                    padding: '14px 8px',
                    borderRadius: '10px',
                    fontWeight: '700',
                    fontSize: '1.1rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    border:
                      !isCustom && amount === val
                        ? '2px solid #0f4c35'
                        : '1.5px solid #e5e7eb',
                    background:
                      !isCustom && amount === val
                        ? '#0f4c35'
                        : 'white',
                    color: !isCustom && amount === val ? 'white' : '#111827',
                  }}
                >
                  £{val}
                </button>
              ))}
            </div>

            {/* Custom amount input */}
            <div style={{ position: 'relative' }}>
              <span
                style={{
                  position: 'absolute',
                  left: '16px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontWeight: '700',
                  color: '#4b5563',
                  fontSize: '1.1rem',
                }}
              >
                £
              </span>
              <input
                type="number"
                min={MIN_AMOUNT}
                max={MAX_AMOUNT}
                step="1"
                placeholder="Or enter custom amount..."
                value={customAmountStr}
                onChange={handleCustomAmountChange}
                style={{
                  width: '100%',
                  padding: '14px 16px 14px 34px',
                  borderRadius: '10px',
                  border: isCustom ? '2px solid #0f4c35' : '1.5px solid #d1d5db',
                  fontSize: '1rem',
                  fontWeight: '600',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          {/* ── STEP 3: FREQUENCY & ANONYMITY ── */}
          <div style={{ marginBottom: '28px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Monthly toggle */}
            <div
              style={{
                display: 'flex',
                background: '#f3f4f6',
                borderRadius: '10px',
                padding: '4px',
              }}
            >
              <button
                type="button"
                onClick={() => setDonationType('ONE_TIME')}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '8px',
                  border: 'none',
                  fontWeight: '700',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  background: donationType === 'ONE_TIME' ? 'white' : 'transparent',
                  color: donationType === 'ONE_TIME' ? '#0f4c35' : '#4b5563',
                  boxShadow: donationType === 'ONE_TIME' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                }}
              >
                One-Time Donation
              </button>
              <button
                type="button"
                onClick={() => setDonationType('MONTHLY')}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '8px',
                  border: 'none',
                  fontWeight: '700',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  background: donationType === 'MONTHLY' ? 'white' : 'transparent',
                  color: donationType === 'MONTHLY' ? '#0f4c35' : '#4b5563',
                  boxShadow: donationType === 'MONTHLY' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                }}
              >
                Monthly Donation
              </button>
            </div>

            {/* Anonymous checkbox */}
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                cursor: 'pointer',
                fontSize: '0.92rem',
                color: '#374151',
                padding: '8px 0',
              }}
            >
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                style={{ width: '18px', height: '18px', accentColor: '#0f4c35' }}
              />
              <span>Donate anonymously (hide name from public receipts)</span>
            </label>

            {!isAnonymous && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <input
                  type="text"
                  placeholder="Your Name (Optional)"
                  value={donorName}
                  onChange={(e) => setDonorName(e.target.value)}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                    fontSize: '0.88rem',
                  }}
                />
                <input
                  type="email"
                  placeholder="Your Email (Optional)"
                  value={donorEmail}
                  onChange={(e) => setDonorEmail(e.target.value)}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                    fontSize: '0.88rem',
                  }}
                />
              </div>
            )}
          </div>

          {/* ── ERROR MESSAGE ── */}
          {errorMessage && (
            <div
              style={{
                background: '#fef2f2',
                border: '1px solid #f87171',
                borderRadius: '10px',
                padding: '12px 16px',
                color: '#991b1b',
                fontSize: '0.88rem',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span>⚠️</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* ── SUMMARY BANNER ── */}
          {selectedMosque && amount >= MIN_AMOUNT && (
            <div
              style={{
                background: '#f7f8f5',
                border: '1px solid #e5e7eb',
                borderRadius: '10px',
                padding: '14px 18px',
                marginBottom: '24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <span style={{ fontSize: '0.8rem', color: '#6b7280', textTransform: 'uppercase' }}>
                  Total to donate
                </span>
                <p style={{ margin: 0, fontWeight: '700', color: '#111827', fontSize: '0.95rem' }}>
                  For {selectedMosque.name}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '1.6rem', fontWeight: '800', color: '#0f4c35' }}>
                  £{amount.toFixed(2)}
                </span>
                <span style={{ fontSize: '0.78rem', color: '#6b7280', display: 'block' }}>
                  {donationType === 'MONTHLY' ? 'per month' : 'one-time'}
                </span>
              </div>
            </div>
          )}

          {/* ── PAYPAL BUTTON ── */}
          <div>
            <button
              type="button"
              disabled={isProcessing || !selectedMosque}
              onClick={handleDirectDonate}
              style={{
                width: '100%',
                padding: '16px',
                borderRadius: '12px',
                border: 'none',
                background: isProcessing || !selectedMosque ? '#9ca3af' : '#0070ba',
                color: 'white',
                fontWeight: '800',
                fontSize: '1.05rem',
                cursor: isProcessing || !selectedMosque ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                boxShadow: '0 4px 14px rgba(0, 112, 186, 0.3)',
                transition: 'all 0.2s',
              }}
            >
              {isProcessing ? (
                'Connecting to PayPal...'
              ) : (
                <>
                  <span>💳 Donate £{amount.toFixed(2)} with PayPal</span>
                </>
              )}
            </button>
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '8px',
                marginTop: '12px',
                color: '#6b7280',
                fontSize: '0.8rem',
              }}
            >
              <span>🔒 256-bit SSL encrypted • PayPal Sandbox protection</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
