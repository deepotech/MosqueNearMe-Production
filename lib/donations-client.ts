/**
 * lib/donations-client.ts
 *
 * Frontend client helper to communicate with the external donation backend.
 * Uses NEXT_PUBLIC_DONATION_API_URL or defaults to http://localhost:4000
 */

export const BACKEND_API_BASE =
  process.env.NEXT_PUBLIC_DONATION_API_URL || 'http://localhost:4000';

export interface CreateOrderPayload {
  mosqueId: string;
  mosqueSlug: string;
  mosqueName: string;
  amount: number;
  donationType?: 'ONE_TIME' | 'MONTHLY';
  isAnonymous?: boolean;
  donorName?: string;
  donorEmail?: string;
}

export interface CreateOrderResponse {
  success: boolean;
  donationId: string;
  paypalOrderId: string;
  approveUrl: string;
  amount: number;
  currency: string;
  error?: string;
}

export interface CaptureOrderResponse {
  success: boolean;
  donationId: string;
  status: string;
  captureId?: string;
  amount: number;
  currency: string;
  mosqueName: string;
  alreadyProcessed?: boolean;
  error?: string;
}

export async function createDonationOrder(
  payload: CreateOrderPayload
): Promise<CreateOrderResponse> {
  const res = await fetch(`${BACKEND_API_BASE}/api/donations/create-order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to initialize PayPal order.');
  }
  return data;
}

export async function captureDonationOrder(
  donationId?: string | null,
  orderId?: string | null
): Promise<CaptureOrderResponse> {
  const res = await fetch(`${BACKEND_API_BASE}/api/donations/capture-order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      donationId: donationId || undefined,
      orderId: orderId || undefined,
      token: orderId || undefined,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to capture PayPal payment.');
  }
  return data;
}


export async function getDonationDetails(donationId: string) {
  const res = await fetch(`${BACKEND_API_BASE}/api/donations/${donationId}`);
  if (!res.ok) return null;
  return res.json();
}
