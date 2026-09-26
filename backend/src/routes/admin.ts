import { Router, Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { CONFIG } from '../config';
import { adminAuthLimiter } from '../rate-limiter';

export const adminRouter = Router();

// ─────────────────────────────────────────────────────────────────────────────
// Admin Authentication Middleware — Bearer token only, NO query-string key
// ─────────────────────────────────────────────────────────────────────────────
export function requireAdminAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'] as string | undefined;

  // Accept "Authorization: Bearer <key>" only
  let providedKey: string | undefined;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    providedKey = authHeader.slice('Bearer '.length).trim();
  }

  if (!CONFIG.admin.apiKey || !providedKey || providedKey !== CONFIG.admin.apiKey) {
    return res.status(401).json({ error: 'Unauthorized: missing or invalid admin authorization.' });
  }

  next();
}

// Apply brute-force limiter and auth check to all admin routes
adminRouter.use(adminAuthLimiter, requireAdminAuth);

// GET /api/admin/stats
adminRouter.get('/stats', async (_req: Request, res: Response) => {
  const stats = await db.getOverallStats();
  return res.json(stats);
});

// GET /api/admin/mosques
adminRouter.get('/mosques', async (_req: Request, res: Response) => {
  const ledgers = await db.getAllMosqueLedgers();
  return res.json(ledgers);
});

// GET /api/admin/donations
adminRouter.get('/donations', async (req: Request, res: Response) => {
  const { mosqueId, status, startDate, endDate } = req.query;

  const donations = await db.listDonations({
    mosqueId: typeof mosqueId === 'string' ? mosqueId : undefined,
    status: typeof status === 'string' ? (status as any) : undefined,
    startDate: typeof startDate === 'string' ? startDate : undefined,
    endDate: typeof endDate === 'string' ? endDate : undefined,
  });

  return res.json(donations);
});

// POST /api/admin/payouts — Record a payout
adminRouter.post('/payouts', async (req: Request, res: Response) => {
  const { mosqueId, mosqueNameSnapshot, amount, method, reference, notes, createdBy } = req.body;

  if (!mosqueId || !amount || !reference || !method) {
    return res.status(400).json({
      error: 'mosqueId, amount, method, and reference are required.',
    });
  }

  const numAmount = parseFloat(amount);
  if (isNaN(numAmount) || numAmount <= 0) {
    return res.status(400).json({ error: 'Amount must be a positive number.' });
  }

  const result = await db.createPayout({
    mosqueId,
    mosqueNameSnapshot,
    amount: numAmount,
    method,
    reference,
    notes,
    createdBy: createdBy || 'Admin',
  });

  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }

  return res.status(201).json({ success: true, payout: result.payout });
});

// GET /api/admin/payouts
adminRouter.get('/payouts', async (req: Request, res: Response) => {
  const mosqueId = typeof req.query.mosqueId === 'string' ? req.query.mosqueId : undefined;
  const payouts = await db.listPayouts(mosqueId);
  return res.json(payouts);
});

// GET /api/admin/balance/:mosqueId
adminRouter.get('/balance/:mosqueId', async (req: Request, res: Response) => {
  const mosqueId = String(req.params.mosqueId || '');
  if (!mosqueId) {
    return res.status(400).json({ error: 'mosqueId is required.' });
  }
  const balance = await db.getMosqueBalance(mosqueId);
  return res.json(balance);
});

// GET /api/admin/export-csv — Reconciliation export with full PayPal fields
adminRouter.get('/export-csv', async (_req: Request, res: Response) => {
  const donations = await db.listDonations();

  const headers = [
    'Donation ID',
    'Mosque ID',
    'Mosque Slug',
    'Mosque Name',
    'Amount',
    'Currency',
    'Status',
    'Type',
    'PayPal Order ID',
    'PayPal Capture ID',
    'PayPal custom_id',
    'Anonymous',
    'Created Date',
    'Completed Date',
  ];

  const escapeCell = (val: string | number | undefined) => {
    if (val === undefined || val === null) return '""';
    return `"${String(val).replace(/"/g, '""')}"`;
  };

  const rows = donations.map((d) => [
    escapeCell(d.id),
    escapeCell(d.mosqueId),
    escapeCell(d.mosqueSlug),
    escapeCell(d.mosqueNameSnapshot),
    d.amount.toFixed(2),
    d.currency,
    d.status,
    d.donationType,
    escapeCell(d.paypalOrderId),
    escapeCell(d.paypalCaptureId),
    escapeCell(d.paypalCustomId),
    d.isAnonymous ? 'Yes' : 'No',
    d.createdAt,
    d.completedAt || '',
  ]);

  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename=mosquenearme-donations-${new Date().toISOString().slice(0, 10)}.csv`
  );
  return res.send(csv);
});

// GET /api/admin/dashboard — Admin dashboard (no secrets in HTML or links)
adminRouter.get('/dashboard', async (_req: Request, res: Response) => {
  const [stats, ledgers, donations] = await Promise.all([
    db.getOverallStats(),
    db.getAllMosqueLedgers(),
    db.listDonations(),
  ]);
  const recentDonations = donations.slice(0, 20);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>MosqueNearMe - Admin Donations Dashboard</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex, nofollow">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f7f8f5; color: #111827; margin: 0; padding: 24px; }
    .container { max-width: 1200px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    h1 { color: #0f4c35; margin: 0; }
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 32px; }
    .stat-card { background: white; border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
    .stat-title { font-size: 0.85rem; color: #6b7280; font-weight: 600; text-transform: uppercase; margin-bottom: 8px; }
    .stat-value { font-size: 1.8rem; font-weight: 800; color: #0f4c35; }
    .section-title { font-size: 1.3rem; font-weight: 700; margin: 32px 0 16px; color: #111827; }
    table { width: 100%; border-collapse: collapse; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.05); border: 1px solid #e5e7eb; }
    th { background: #0f4c35; color: white; text-align: left; padding: 12px 16px; font-size: 0.85rem; }
    td { padding: 12px 16px; border-bottom: 1px solid #f3f4f6; font-size: 0.9rem; }
    tr:last-child td { border-bottom: none; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 99px; font-size: 0.75rem; font-weight: 700; }
    .badge-completed { background: #d1fae5; color: #065f46; }
    .badge-pending { background: #fef3c7; color: #92400e; }
    .badge-refunded { background: #fee2e2; color: #991b1b; }
    .badge-failed { background: #f3f4f6; color: #374151; }
    .notice { background: #fffbeb; border: 1px solid #fcd34d; border-radius: 8px; padding: 10px 16px; font-size: 0.85rem; color: #92400e; margin-bottom: 20px; }
    .btn { display: inline-flex; align-items: center; padding: 8px 16px; border-radius: 8px; font-weight: 600; font-size: 0.875rem; text-decoration: none; cursor: pointer; border: none; }
    .btn-primary { background: #0f4c35; color: white; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div>
        <h1>🕌 MosqueNearMe — Donations Dashboard</h1>
        <p style="color: #6b7280; margin: 4px 0 0;">Centralized PayPal Ledger &amp; Payout Reconciliation</p>
      </div>
      <div>
        <p class="notice">📥 To export CSV, use: <code>GET /api/admin/export-csv</code> with <code>Authorization: Bearer &lt;key&gt;</code></p>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-title">Total Collected</div>
        <div class="stat-value">£${stats.totalAmountCollected.toFixed(2)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-title">Completed Donations</div>
        <div class="stat-value">${stats.completedDonations}</div>
      </div>
      <div class="stat-card">
        <div class="stat-title">Total Refunded</div>
        <div class="stat-value">£${stats.totalAmountRefunded.toFixed(2)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-title">Total Paid Out</div>
        <div class="stat-value">£${stats.totalAmountPaidOut.toFixed(2)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-title">Remaining Balance</div>
        <div class="stat-value">£${stats.totalRemainingBalance.toFixed(2)}</div>
      </div>
    </div>

    <div class="section-title">Mosque Balances &amp; Payout Tracking</div>
    <table>
      <thead>
        <tr>
          <th>Mosque</th>
          <th>Donations</th>
          <th>Collected</th>
          <th>Refunded</th>
          <th>Paid Out</th>
          <th>Remaining</th>
          <th>Last Donation</th>
        </tr>
      </thead>
      <tbody>
        ${
          ledgers.length === 0
            ? '<tr><td colspan="7" style="text-align:center; color:#6b7280; padding:24px;">No donations recorded yet.</td></tr>'
            : ledgers
                .map(
                  (l) => `
          <tr>
            <td><strong>${l.mosqueName}</strong><br><small style="color:#6b7280;">ID: ${l.mosqueId}</small></td>
            <td>${l.donationCount}</td>
            <td>£${l.totalCompletedAmount.toFixed(2)}</td>
            <td>£${l.totalRefundedAmount.toFixed(2)}</td>
            <td>£${l.totalPaidOutAmount.toFixed(2)}</td>
            <td><strong style="color: ${l.remainingBalance > 0 ? '#059669' : '#6b7280'};">£${l.remainingBalance.toFixed(2)}</strong></td>
            <td>${l.lastDonationDate ? new Date(l.lastDonationDate).toLocaleDateString() : '—'}</td>
          </tr>`
                )
                .join('')
        }
      </tbody>
    </table>

    <div class="section-title">Recent Donations</div>
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Mosque</th>
          <th>Amount</th>
          <th>Status</th>
          <th>PayPal Order ID</th>
          <th>Capture ID</th>
          <th>Date</th>
        </tr>
      </thead>
      <tbody>
        ${
          recentDonations.length === 0
            ? '<tr><td colspan="7" style="text-align:center; color:#6b7280; padding:24px;">No donations recorded yet.</td></tr>'
            : recentDonations
                .map(
                  (d) => `
          <tr>
            <td><code>${d.id}</code></td>
            <td>${d.mosqueNameSnapshot}</td>
            <td><strong>£${d.amount.toFixed(2)}</strong></td>
            <td><span class="badge badge-${d.status.toLowerCase()}">${d.status}</span></td>
            <td><small>${d.paypalOrderId || '—'}</small></td>
            <td><small>${d.paypalCaptureId || '—'}</small></td>
            <td>${new Date(d.createdAt).toLocaleString()}</td>
          </tr>`
                )
                .join('')
        }
      </tbody>
    </table>
  </div>
</body>
</html>`;

  return res.send(html);
});
