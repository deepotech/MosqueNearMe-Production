import { CONFIG } from './config';

interface PayPalAccessToken {
  token: string;
  expiresAt: number;
}

let cachedToken: PayPalAccessToken | null = null;

export async function getPayPalAccessToken(): Promise<string> {
  // If in LIVE mode, NEVER allow mock tokens
  if (CONFIG.paypal.mode === 'live') {
    if (!CONFIG.paypal.clientId || !CONFIG.paypal.clientSecret) {
      throw new Error(
        'PayPal LIVE credentials missing. PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET must be set when PAYPAL_MODE=live.'
      );
    }
  }

  // Return mock token ONLY in sandbox when placeholder credentials are used
  if (
    CONFIG.paypal.mode === 'sandbox' &&
    (CONFIG.paypal.clientId === 'sandbox_client_id_placeholder' ||
      CONFIG.paypal.clientId === 'sb' ||
      !CONFIG.paypal.clientSecret ||
      CONFIG.paypal.clientSecret === 'sandbox_client_secret_placeholder')
  ) {
    return 'mock_sandbox_access_token';
  }

  // Check cached token
  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt > now + 60000) {
    return cachedToken.token;
  }

  const auth = Buffer.from(
    `${CONFIG.paypal.clientId}:${CONFIG.paypal.clientSecret}`
  ).toString('base64');

  const response = await fetch(`${CONFIG.paypal.baseUrl}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to obtain PayPal access token: ${response.status} ${errorText}`);
  }

  const data = (await response.json()) as { access_token: string; expires_in: number };
  cachedToken = {
    token: data.access_token,
    expiresAt: now + data.expires_in * 1000,
  };

  return cachedToken.token;
}

export async function createPayPalOrder(params: {
  donationId: string;
  mosqueId: string;
  mosqueName: string;
  amount: number;
  currency: string;
}): Promise<{ orderId: string; status: string; approveUrl: string }> {
  // If running with mock sandbox credentials (SANDBOX ONLY)
  if (
    CONFIG.paypal.mode === 'sandbox' &&
    (CONFIG.paypal.clientId === 'sandbox_client_id_placeholder' ||
      CONFIG.paypal.clientId === 'sb' ||
      !CONFIG.paypal.clientSecret ||
      CONFIG.paypal.clientSecret === 'sandbox_client_secret_placeholder')
  ) {
    const mockId = `MOCK-PAYPAL-ORDER-${params.donationId}`;
    return {
      orderId: mockId,
      status: 'CREATED',
      approveUrl: `/donate/success?token=${mockId}`,
    };
  }

  if (CONFIG.paypal.mode === 'live' && (!CONFIG.paypal.clientId || !CONFIG.paypal.clientSecret)) {
    throw new Error('Cannot create PayPal LIVE order: missing PAYPAL_CLIENT_ID or PAYPAL_CLIENT_SECRET.');
  }

  const accessToken = await getPayPalAccessToken();

  const payload = {
    intent: 'CAPTURE',
    purchase_units: [
      {
        reference_id: params.donationId,
        custom_id: params.donationId, // Permanent link to our internal Donation ID
        description: `Support ${params.mosqueName} via MosqueNearMe`,
        amount: {
          currency_code: params.currency,
          value: params.amount.toFixed(2),
        },
      },
    ],
    application_context: {
      brand_name: 'MosqueNearMe',
      landing_page: 'NO_PREFERENCE',
      user_action: 'PAY_NOW',
      return_url: `${CONFIG.frontendUrl}/donate/success`,
      cancel_url: `${CONFIG.frontendUrl}/donate/cancel`,
    },
  };

  const response = await fetch(`${CONFIG.paypal.baseUrl}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`PayPal Create Order Error: ${response.status} ${err}`);
  }

  const data = (await response.json()) as {
    id: string;
    status: string;
    links?: Array<{ href: string; rel: string }>;
  };
  const approveUrl = data.links?.find((l) => l.rel === 'approve')?.href || '';

  return { orderId: data.id, status: data.status, approveUrl };
}

export async function capturePayPalOrder(orderId: string): Promise<{
  captureId: string;
  status: string;
  amount: number;
  currency: string;
  customId?: string;
  raw: unknown;
}> {
  // If running with mock sandbox credentials (SANDBOX ONLY)
  if (orderId.startsWith('MOCK-PAYPAL-ORDER-')) {
    if (CONFIG.paypal.mode === 'live') {
      throw new Error('Cannot process mock order in PayPal LIVE mode.');
    }
    const donationId = orderId.replace('MOCK-PAYPAL-ORDER-', '');
    return {
      captureId: `MOCK-CAPTURE-${donationId}`,
      status: 'COMPLETED',
      amount: 25.0,
      currency: 'GBP',
      customId: donationId,
      raw: { mock: true, orderId },
    };
  }

  if (CONFIG.paypal.mode === 'live' && (!CONFIG.paypal.clientId || !CONFIG.paypal.clientSecret)) {
    throw new Error('Cannot capture PayPal LIVE order: missing PAYPAL_CLIENT_ID or PAYPAL_CLIENT_SECRET.');
  }

  const accessToken = await getPayPalAccessToken();

  const response = await fetch(
    `${CONFIG.paypal.baseUrl}/v2/checkout/orders/${orderId}/capture`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`PayPal Capture Order Error: ${response.status} ${err}`);
  }

  const data = (await response.json()) as any;
  const capture = data.purchase_units?.[0]?.payments?.captures?.[0];

  if (!capture) {
    throw new Error('No capture details returned by PayPal');
  }

  return {
    captureId: capture.id,
    status: capture.status,
    amount: parseFloat(capture.amount?.value || '0'),
    currency: capture.amount?.currency_code || 'GBP',
    customId: capture.custom_id,
    raw: data,
  };
}

export async function verifyPayPalWebhookSignature(params: {
  headers: Record<string, string | string[] | undefined>;
  rawBody: string;
}): Promise<boolean> {
  // In LIVE mode or production, webhook ID is mandatory. Never bypass verification.
  if (!CONFIG.paypal.webhookId) {
    if (CONFIG.paypal.mode === 'live' || CONFIG.nodeEnv === 'production') {
      console.error(
        '[PayPal Webhook] CRITICAL: PAYPAL_WEBHOOK_ID is not configured. Webhooks are rejected in production.'
      );
      return false;
    }
    // Sandbox dev mode only
    return true;
  }

  const accessToken = await getPayPalAccessToken();

  const getHeader = (name: string): string => {
    const val = params.headers[name] || params.headers[name.toLowerCase()];
    if (Array.isArray(val)) return val[0] || '';
    return val || '';
  };

  let webhookEvent: any;
  try {
    webhookEvent = typeof params.rawBody === 'string' ? JSON.parse(params.rawBody) : params.rawBody;
  } catch {
    console.warn('[PayPal] Webhook verification failed: invalid rawBody JSON.');
    return false;
  }

  const payload = {
    transmission_id: getHeader('paypal-transmission-id'),
    transmission_time: getHeader('paypal-transmission-time'),
    cert_url: getHeader('paypal-cert-url'),
    auth_algo: getHeader('paypal-auth-algo'),
    transmission_sig: getHeader('paypal-transmission-sig'),
    webhook_id: CONFIG.paypal.webhookId,
    webhook_event: webhookEvent,
  };

  const response = await fetch(
    `${CONFIG.paypal.baseUrl}/v1/notifications/verify-webhook-signature`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    return false;
  }

  const data = (await response.json()) as { verification_status: string };
  return data.verification_status === 'SUCCESS';
}
