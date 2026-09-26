import path from 'path';
import fs from 'fs';

// Lightweight zero-dependency .env loader
function loadEnvFile(envPath: string) {
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx !== -1) {
        const key = trimmed.slice(0, eqIdx).trim();
        const value = trimmed.slice(eqIdx + 1).trim();
        if (!process.env[key]) {
          process.env[key] = value.replace(/^["']|["']$/g, '');
        }
      }
    }
  }
}

// Try loading backend .env and parent .env
loadEnvFile(path.resolve(__dirname, '..', '.env'));
loadEnvFile(path.resolve(process.cwd(), '.env'));

export const CONFIG = {
  port: parseInt(process.env.PORT || '4000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || '',
  corsOrigins: (process.env.CORS_ORIGIN || 'https://mosquenearme.net,http://localhost:3000')
    .split(',')
    .map((o) => o.trim()),
  frontendUrl:
    process.env.FRONTEND_URL ||
    (process.env.NODE_ENV === 'production' ? 'https://mosquenearme.net' : 'http://localhost:3000'),

  paypal: {
    mode: (process.env.PAYPAL_MODE || (process.env.NODE_ENV === 'production' ? 'live' : 'sandbox')) as 'sandbox' | 'live',
    clientId:
      process.env.PAYPAL_CLIENT_ID ||
      (process.env.PAYPAL_MODE === 'live' || process.env.NODE_ENV === 'production'
        ? ''
        : 'sandbox_client_id_placeholder'),
    clientSecret:
      process.env.PAYPAL_CLIENT_SECRET ||
      (process.env.PAYPAL_MODE === 'live' || process.env.NODE_ENV === 'production'
        ? ''
        : 'sandbox_client_secret_placeholder'),
    webhookId: process.env.PAYPAL_WEBHOOK_ID || '',
    baseUrl:
      (process.env.PAYPAL_MODE || (process.env.NODE_ENV === 'production' ? 'live' : 'sandbox')) === 'live'
        ? 'https://api-m.paypal.com'
        : 'https://api-m.sandbox.paypal.com',
  },

  admin: {
    apiKey:
      process.env.ADMIN_API_KEY ||
      (process.env.NODE_ENV === 'production' ? '' : 'mne_admin_secret_key_2026'),
  },

  donation: {
    currency: 'GBP',
    minAmount: 1.0,
    maxAmount: 5000.0,
    suggestedAmounts: [5, 10, 25, 50],
  },

  storage: {
    dbFilePath: path.resolve(__dirname, '..', 'data', 'donations-db.json'),
  },
};
