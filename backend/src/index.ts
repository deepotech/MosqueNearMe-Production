import express from 'express';
import cors from 'cors';
import { CONFIG } from './config';
import { donationsRouter } from './routes/donations';
import { webhooksRouter } from './routes/webhooks';
import { adminRouter } from './routes/admin';
import { generalApiLimiter } from './rate-limiter';
import { getMosqueCount } from './mosque-validator';

const app = express();

// ─────────────────────────────────────────────────────────────────────────────
// CORS — strict allowlist for production
// ─────────────────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. server-to-server PayPal webhooks, curl, health checks)
      if (!origin) {
        return callback(null, true);
      }

      if (
        CONFIG.corsOrigins.includes(origin) ||
        CONFIG.corsOrigins.includes('*') ||
        origin.endsWith('.mosquenearme.net')
      ) {
        return callback(null, true);
      }

      return callback(new Error(`CORS: origin '${origin}' not allowed.`));
    },
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ─────────────────────────────────────────────────────────────────────────────
// Capture raw body for PayPal webhook signature verification
// ─────────────────────────────────────────────────────────────────────────────
app.use(
  express.json({
    limit: '1mb',
    verify: (req: any, _res, buf) => {
      req.rawBody = buf.toString('utf-8');
    },
  })
);

// ─────────────────────────────────────────────────────────────────────────────
// General API rate limiter (applied globally except webhooks)
// ─────────────────────────────────────────────────────────────────────────────
app.use('/api/donations', generalApiLimiter);
app.use('/api/admin', generalApiLimiter);

// ─────────────────────────────────────────────────────────────────────────────
// Health check (unauthenticated, no sensitive info)
// ─────────────────────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  const mosqueCount = getMosqueCount();
  res.json({
    status: 'healthy',
    mode: CONFIG.paypal.mode,
    mosqueCount,
    mosqueRegistryOk: mosqueCount > 0,
    timestamp: new Date().toISOString(),
  });
});


// ─────────────────────────────────────────────────────────────────────────────
// Mount Routes
// ─────────────────────────────────────────────────────────────────────────────
app.use('/api/donations', donationsRouter);
app.use('/api/paypal/webhook', webhooksRouter);
app.use('/api/admin', adminRouter);

// ─────────────────────────────────────────────────────────────────────────────
// /admin redirect — goes to dashboard; authentication is handled by the router
// No API key in URL or query string
// ─────────────────────────────────────────────────────────────────────────────
app.get('/admin', (_req, res) => {
  res.redirect('/api/admin/dashboard');
});

// Central error handler for CORS / parsing errors
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err.message && err.message.startsWith('CORS:')) {
    return res.status(403).json({ error: err.message });
  }
  console.error('[Server Error]', err);
  return res.status(500).json({ error: 'Internal server error.' });
});

// ─────────────────────────────────────────────────────────────────────────────
// Start server
// ─────────────────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.listen(CONFIG.port, '0.0.0.0', () => {
    console.log(`=======================================================`);
    console.log(`🕌 MosqueNearMe Donation Backend running on port ${CONFIG.port}`);
    console.log(`   PayPal Mode  : ${CONFIG.paypal.mode.toUpperCase()}`);
    console.log(`   Health Check : http://localhost:${CONFIG.port}/health`);
    console.log(`   Admin Panel  : http://localhost:${CONFIG.port}/admin`);
    console.log(`   Auth         : Authorization: Bearer <ADMIN_API_KEY>`);
    // NEVER log the actual API key here
    console.log(`=======================================================`);
  });
}

export default app;
