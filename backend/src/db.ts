import crypto from 'crypto';
import { CONFIG } from './config';
import { Donation, Payout, MosqueLedger, DonationStats, DonationStatus } from './types';

// Simple Async Mutex for in-process concurrency safety
class AsyncMutex {
  private queue: Array<() => void> = [];
  private locked = false;

  public async acquire(): Promise<() => void> {
    return new Promise((resolve) => {
      const run = () => {
        this.locked = true;
        resolve(() => {
          this.locked = false;
          const next = this.queue.shift();
          if (next) next();
        });
      };

      if (!this.locked) {
        run();
      } else {
        this.queue.push(run);
      }
    });
  }
}

export interface IDatabase {
  createDonation(params: {
    mosqueId: string;
    mosqueSlug: string;
    mosqueNameSnapshot: string;
    amount: number;
    currency?: string;
    donationType?: 'ONE_TIME' | 'MONTHLY';
    isAnonymous?: boolean;
    donorName?: string;
    donorEmail?: string;
    paypalOrderId?: string;
  }): Promise<Donation>;

  getDonationById(id: string): Promise<Donation | null>;
  getDonationByPayPalOrderId(orderId: string): Promise<Donation | null>;
  getDonationByCustomId(customId: string): Promise<Donation | null>;
  getDonationByCaptureId(captureId: string): Promise<Donation | null>;

  updateDonation(
    id: string,
    updates: Partial<Pick<Donation, 'status' | 'paypalOrderId' | 'paypalCaptureId' | 'completedAt' | 'metadata'>>
  ): Promise<Donation | null>;

  listDonations(filters?: {
    mosqueId?: string;
    status?: DonationStatus;
    startDate?: string;
    endDate?: string;
  }): Promise<Donation[]>;

  createPayout(params: {
    mosqueId: string;
    mosqueNameSnapshot?: string;
    amount: number;
    currency?: string;
    method: string;
    reference: string;
    notes?: string;
    createdBy: string;
  }): Promise<{ success: boolean; payout?: Payout; error?: string }>;

  listPayouts(mosqueId?: string): Promise<Payout[]>;

  getMosqueBalance(mosqueId: string): Promise<{
    mosqueId: string;
    totalCompletedAmount: number;
    totalRefundedAmount: number;
    totalPaidOutAmount: number;
    remainingBalance: number;
  }>;

  getAllMosqueLedgers(): Promise<MosqueLedger[]>;
  getOverallStats(): Promise<DonationStats>;

  /**
   * Webhook idempotency — persistent check.
   * Returns true if the webhook event ID has already been processed.
   * MemoryDatabase uses an in-process Set (sufficient for single-instance).
   * PostgresDatabase uses the webhook_events table (survives restarts & multi-instance).
   */
  isWebhookEventProcessed(eventId: string): Promise<boolean>;

  /**
   * Mark a webhook event ID as processed.
   * Must be called atomically with any state changes the event causes.
   */
  markWebhookEventProcessed(eventId: string, eventType: string, donationId?: string): Promise<void>;
}

// ─────────────────────────────────────────────────────────────────────────────
// In-Memory / Test Database with Mutex & Strict ACID Invariants
// ─────────────────────────────────────────────────────────────────────────────
export class MemoryDatabase implements IDatabase {
  private donations: Donation[] = [];
  private payouts: Payout[] = [];
  private mutex = new AsyncMutex();

  public generateDonationId(): string {
    const random = crypto.randomBytes(4).toString('hex').toUpperCase();
    return `MNM-DON-${random}`;
  }

  public generatePayoutId(): string {
    const random = crypto.randomBytes(4).toString('hex').toUpperCase();
    return `MNM-PAY-${random}`;
  }

  public async createDonation(params: {
    mosqueId: string;
    mosqueSlug: string;
    mosqueNameSnapshot: string;
    amount: number;
    currency?: string;
    donationType?: 'ONE_TIME' | 'MONTHLY';
    isAnonymous?: boolean;
    donorName?: string;
    donorEmail?: string;
    paypalOrderId?: string;
  }): Promise<Donation> {
    const unlock = await this.mutex.acquire();
    try {
      const now = new Date().toISOString();
      const id = this.generateDonationId();

      const newDonation: Donation = {
        id,
        mosqueId: params.mosqueId,
        mosqueSlug: params.mosqueSlug,
        mosqueNameSnapshot: params.mosqueNameSnapshot,
        amount: Math.round(params.amount * 100) / 100,
        currency: (params.currency || CONFIG.donation.currency).toUpperCase(),
        donationType: params.donationType || 'ONE_TIME',
        status: 'CREATED',
        paypalOrderId: params.paypalOrderId,
        paypalCustomId: id,
        isAnonymous: Boolean(params.isAnonymous),
        donorName: params.isAnonymous ? undefined : params.donorName?.trim() || undefined,
        donorEmail: params.isAnonymous ? undefined : params.donorEmail?.trim() || undefined,
        createdAt: now,
        updatedAt: now,
      };

      this.donations.push(newDonation);
      return newDonation;
    } finally {
      unlock();
    }
  }

  public async getDonationById(id: string): Promise<Donation | null> {
    return this.donations.find((d) => d.id === id) || null;
  }

  public async getDonationByPayPalOrderId(orderId: string): Promise<Donation | null> {
    return this.donations.find((d) => d.paypalOrderId === orderId) || null;
  }

  public async getDonationByCustomId(customId: string): Promise<Donation | null> {
    return this.donations.find((d) => d.paypalCustomId === customId || d.id === customId) || null;
  }

  public async getDonationByCaptureId(captureId: string): Promise<Donation | null> {
    return this.donations.find((d) => d.paypalCaptureId === captureId) || null;
  }

  public async updateDonation(
    id: string,
    updates: Partial<Pick<Donation, 'status' | 'paypalOrderId' | 'paypalCaptureId' | 'completedAt' | 'metadata'>>
  ): Promise<Donation | null> {
    const unlock = await this.mutex.acquire();
    try {
      const index = this.donations.findIndex((d) => d.id === id);
      if (index === -1) return null;

      const current = this.donations[index];
      const updated: Donation = {
        ...current,
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      this.donations[index] = updated;
      return updated;
    } finally {
      unlock();
    }
  }

  public async listDonations(filters?: {
    mosqueId?: string;
    status?: DonationStatus;
    startDate?: string;
    endDate?: string;
  }): Promise<Donation[]> {
    let result = [...this.donations];

    if (filters?.mosqueId) {
      result = result.filter((d) => d.mosqueId === filters.mosqueId);
    }
    if (filters?.status) {
      result = result.filter((d) => d.status === filters.status);
    }
    if (filters?.startDate) {
      result = result.filter((d) => d.createdAt >= filters.startDate!);
    }
    if (filters?.endDate) {
      result = result.filter((d) => d.createdAt <= filters.endDate!);
    }

    return result.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  public async getMosqueBalance(mosqueId: string): Promise<{
    mosqueId: string;
    totalCompletedAmount: number;
    totalRefundedAmount: number;
    totalPaidOutAmount: number;
    remainingBalance: number;
  }> {
    const mosqueDonations = this.donations.filter((d) => d.mosqueId === mosqueId);
    const mosquePayouts = this.payouts.filter((p) => p.mosqueId === mosqueId && p.status === 'PAID');

    let totalCompleted = 0;
    let totalRefunded = 0;

    for (const d of mosqueDonations) {
      if (d.status === 'COMPLETED' || (d.status === 'REFUNDED' && d.completedAt)) {
        totalCompleted += d.amount;
      }
      if (d.status === 'REFUNDED') {
        totalRefunded += d.amount;
      }
    }

    let totalPaidOut = 0;
    for (const p of mosquePayouts) {
      totalPaidOut += p.amount;
    }

    totalCompleted = Math.round(totalCompleted * 100) / 100;
    totalRefunded = Math.round(totalRefunded * 100) / 100;
    totalPaidOut = Math.round(totalPaidOut * 100) / 100;
    const remainingBalance = Math.round((totalCompleted - totalRefunded - totalPaidOut) * 100) / 100;

    return {
      mosqueId,
      totalCompletedAmount: totalCompleted,
      totalRefundedAmount: totalRefunded,
      totalPaidOutAmount: totalPaidOut,
      remainingBalance,
    };
  }

  public async createPayout(params: {
    mosqueId: string;
    mosqueNameSnapshot?: string;
    amount: number;
    currency?: string;
    method: string;
    reference: string;
    notes?: string;
    createdBy: string;
  }): Promise<{ success: boolean; payout?: Payout; error?: string }> {
    // Acquire mutex lock to prevent concurrent payout races
    const unlock = await this.mutex.acquire();
    try {
      if (params.amount <= 0) {
        return { success: false, error: 'Payout amount must be greater than zero.' };
      }

      const balance = await this.getMosqueBalance(params.mosqueId);
      const roundedAmount = Math.round(params.amount * 100) / 100;

      if (roundedAmount > balance.remainingBalance) {
        return {
          success: false,
          error: `Payout of £${roundedAmount.toFixed(2)} exceeds available remaining balance of £${balance.remainingBalance.toFixed(2)}.`,
        };
      }

      const now = new Date().toISOString();
      const newPayout: Payout = {
        id: this.generatePayoutId(),
        mosqueId: params.mosqueId,
        mosqueNameSnapshot: params.mosqueNameSnapshot,
        amount: roundedAmount,
        currency: (params.currency || CONFIG.donation.currency).toUpperCase(),
        method: params.method.trim(),
        reference: params.reference.trim(),
        notes: params.notes?.trim() || undefined,
        paidAt: now,
        createdAt: now,
        createdBy: params.createdBy.trim(),
        status: 'PAID',
      };

      this.payouts.push(newPayout);
      return { success: true, payout: newPayout };
    } finally {
      unlock();
    }
  }

  public async listPayouts(mosqueId?: string): Promise<Payout[]> {
    let result = [...this.payouts];
    if (mosqueId) {
      result = result.filter((p) => p.mosqueId === mosqueId);
    }
    return result.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  public async getAllMosqueLedgers(): Promise<MosqueLedger[]> {
    const ledgersMap = new Map<string, MosqueLedger>();

    for (const d of this.donations) {
      let ledger = ledgersMap.get(d.mosqueId);
      if (!ledger) {
        ledger = {
          mosqueId: d.mosqueId,
          mosqueName: d.mosqueNameSnapshot,
          donationCount: 0,
          totalCompletedAmount: 0,
          totalRefundedAmount: 0,
          totalPaidOutAmount: 0,
          remainingBalance: 0,
          lastDonationDate: undefined,
        };
        ledgersMap.set(d.mosqueId, ledger);
      }

      if (d.status === 'COMPLETED' || (d.status === 'REFUNDED' && d.completedAt)) {
        ledger.donationCount += 1;
        ledger.totalCompletedAmount = Math.round((ledger.totalCompletedAmount + d.amount) * 100) / 100;
        if (!ledger.lastDonationDate || d.createdAt > ledger.lastDonationDate) {
          ledger.lastDonationDate = d.createdAt;
        }
      }
      if (d.status === 'REFUNDED') {
        ledger.totalRefundedAmount = Math.round((ledger.totalRefundedAmount + d.amount) * 100) / 100;
      }
    }

    for (const p of this.payouts) {
      if (p.status !== 'PAID') continue;
      let ledger = ledgersMap.get(p.mosqueId);
      if (!ledger) {
        ledger = {
          mosqueId: p.mosqueId,
          mosqueName: p.mosqueNameSnapshot || `Mosque #${p.mosqueId}`,
          donationCount: 0,
          totalCompletedAmount: 0,
          totalRefundedAmount: 0,
          totalPaidOutAmount: 0,
          remainingBalance: 0,
        };
        ledgersMap.set(p.mosqueId, ledger);
      }
      ledger.totalPaidOutAmount = Math.round((ledger.totalPaidOutAmount + p.amount) * 100) / 100;
    }

    for (const ledger of ledgersMap.values()) {
      ledger.remainingBalance =
        Math.round((ledger.totalCompletedAmount - ledger.totalRefundedAmount - ledger.totalPaidOutAmount) * 100) / 100;
    }

    return Array.from(ledgersMap.values()).sort((a, b) => b.totalCompletedAmount - a.totalCompletedAmount);
  }

  public async getOverallStats(): Promise<DonationStats> {
    let completed = 0;
    let pending = 0;
    let refunded = 0;
    let failed = 0;

    let totalCollected = 0;
    let totalRefunded = 0;

    for (const d of this.donations) {
      if (d.status === 'COMPLETED' || (d.status === 'REFUNDED' && d.completedAt)) {
        completed += 1;
        totalCollected += d.amount;
      }
      if (d.status === 'REFUNDED') {
        refunded += 1;
        totalRefunded += d.amount;
      } else if (d.status === 'PENDING' || d.status === 'CREATED') {
        pending += 1;
      } else if (d.status === 'FAILED' || d.status === 'CANCELLED') {
        failed += 1;
      }
    }

    let totalPaidOut = 0;
    for (const p of this.payouts) {
      if (p.status === 'PAID') {
        totalPaidOut += p.amount;
      }
    }

    totalCollected = Math.round(totalCollected * 100) / 100;
    totalRefunded = Math.round(totalRefunded * 100) / 100;
    totalPaidOut = Math.round(totalPaidOut * 100) / 100;
    const totalRemaining = Math.round((totalCollected - totalRefunded - totalPaidOut) * 100) / 100;

    return {
      totalDonations: this.donations.length,
      completedDonations: completed,
      pendingDonations: pending,
      refundedDonations: refunded,
      failedDonations: failed,
      totalAmountCollected: totalCollected,
      totalAmountRefunded: totalRefunded,
      totalAmountPaidOut: totalPaidOut,
      totalRemainingBalance: totalRemaining,
    };
  }

  // ── Webhook idempotency (in-process, single-instance) ─────────────────────
  // For multi-instance deployments use PostgresDatabase which persists to DB.
  private processedEvents = new Set<string>();

  public async isWebhookEventProcessed(eventId: string): Promise<boolean> {
    return this.processedEvents.has(eventId);
  }

  public async markWebhookEventProcessed(eventId: string, _eventType: string, _donationId?: string): Promise<void> {
    this.processedEvents.add(eventId);
    // Evict old entries to prevent unbounded memory growth
    if (this.processedEvents.size > 10_000) {
      const first = this.processedEvents.values().next().value;
      if (first) this.processedEvents.delete(first);
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Production PostgreSQL Database Adapter
// ─────────────────────────────────────────────────────────────────────────────
export class PostgresDatabase implements IDatabase {
  private pool: any;

  constructor(connectionString: string) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { Pool } = require('pg');
      this.pool = new Pool({ connectionString, ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined });
    } catch {
      throw new Error("Package 'pg' is required when DATABASE_URL is set. Run `npm install pg @types/pg`.");
    }
  }

  public async init(): Promise<void> {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS donations (
        id VARCHAR(64) PRIMARY KEY,
        mosque_id VARCHAR(64) NOT NULL,
        mosque_slug VARCHAR(255) NOT NULL,
        mosque_name_snapshot VARCHAR(255) NOT NULL,
        amount NUMERIC(10, 2) NOT NULL,
        currency VARCHAR(10) NOT NULL DEFAULT 'GBP',
        donation_type VARCHAR(20) NOT NULL DEFAULT 'ONE_TIME',
        status VARCHAR(20) NOT NULL DEFAULT 'CREATED',
        paypal_order_id VARCHAR(128) UNIQUE,
        paypal_capture_id VARCHAR(128) UNIQUE,
        paypal_custom_id VARCHAR(128) NOT NULL,
        is_anonymous BOOLEAN NOT NULL DEFAULT FALSE,
        donor_name VARCHAR(255),
        donor_email VARCHAR(255),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        completed_at TIMESTAMPTZ,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        metadata JSONB
      );

      CREATE TABLE IF NOT EXISTS payouts (
        id VARCHAR(64) PRIMARY KEY,
        mosque_id VARCHAR(64) NOT NULL,
        mosque_name_snapshot VARCHAR(255),
        amount NUMERIC(10, 2) NOT NULL,
        currency VARCHAR(10) NOT NULL DEFAULT 'GBP',
        method VARCHAR(64) NOT NULL,
        reference VARCHAR(128) NOT NULL,
        notes TEXT,
        paid_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        created_by VARCHAR(128) NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'PAID'
      );

      CREATE TABLE IF NOT EXISTS webhook_events (
        event_id VARCHAR(128) PRIMARY KEY,
        event_type VARCHAR(128) NOT NULL,
        donation_id VARCHAR(64),
        processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_donations_mosque_id ON donations(mosque_id);
      CREATE INDEX IF NOT EXISTS idx_donations_status ON donations(status);
      CREATE INDEX IF NOT EXISTS idx_donations_created_at ON donations(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_donations_paypal_order ON donations(paypal_order_id);
      CREATE INDEX IF NOT EXISTS idx_donations_paypal_capture ON donations(paypal_capture_id);
      CREATE INDEX IF NOT EXISTS idx_donations_paypal_custom ON donations(paypal_custom_id);
      CREATE INDEX IF NOT EXISTS idx_payouts_mosque_id ON payouts(mosque_id);
      CREATE INDEX IF NOT EXISTS idx_payouts_status ON payouts(status);
    `);
  }


  private mapDonationRow(row: any): Donation {
    return {
      id: row.id,
      mosqueId: row.mosque_id,
      mosqueSlug: row.mosque_slug,
      mosqueNameSnapshot: row.mosque_name_snapshot,
      amount: parseFloat(row.amount),
      currency: row.currency,
      donationType: row.donation_type,
      status: row.status,
      paypalOrderId: row.paypal_order_id || undefined,
      paypalCaptureId: row.paypal_capture_id || undefined,
      paypalCustomId: row.paypal_custom_id,
      isAnonymous: Boolean(row.is_anonymous),
      donorName: row.donor_name || undefined,
      donorEmail: row.donor_email || undefined,
      createdAt: row.created_at.toISOString ? row.created_at.toISOString() : String(row.created_at),
      completedAt: row.completed_at ? (row.completed_at.toISOString ? row.completed_at.toISOString() : String(row.completed_at)) : undefined,
      updatedAt: row.updated_at.toISOString ? row.updated_at.toISOString() : String(row.updated_at),
      metadata: row.metadata || undefined,
    };
  }

  private mapPayoutRow(row: any): Payout {
    return {
      id: row.id,
      mosqueId: row.mosque_id,
      mosqueNameSnapshot: row.mosque_name_snapshot || undefined,
      amount: parseFloat(row.amount),
      currency: row.currency,
      method: row.method,
      reference: row.reference,
      notes: row.notes || undefined,
      paidAt: row.paid_at.toISOString ? row.paid_at.toISOString() : String(row.paid_at),
      createdAt: row.created_at.toISOString ? row.created_at.toISOString() : String(row.created_at),
      createdBy: row.created_by,
      status: 'PAID',
    };
  }

  public async createDonation(params: any): Promise<Donation> {
    const id = `MNM-DON-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    const now = new Date();
    const query = `
      INSERT INTO donations (
        id, mosque_id, mosque_slug, mosque_name_snapshot, amount, currency,
        donation_type, status, paypal_order_id, paypal_custom_id, is_anonymous,
        donor_name, donor_email, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $14)
      RETURNING *;
    `;
    const res = await this.pool.query(query, [
      id,
      params.mosqueId,
      params.mosqueSlug,
      params.mosqueNameSnapshot,
      Math.round(params.amount * 100) / 100,
      (params.currency || 'GBP').toUpperCase(),
      params.donationType || 'ONE_TIME',
      'CREATED',
      params.paypalOrderId || null,
      id,
      Boolean(params.isAnonymous),
      params.isAnonymous ? null : params.donorName?.trim() || null,
      params.isAnonymous ? null : params.donorEmail?.trim() || null,
      now,
    ]);
    return this.mapDonationRow(res.rows[0]);
  }

  public async getDonationById(id: string): Promise<Donation | null> {
    const res = await this.pool.query('SELECT * FROM donations WHERE id = $1', [id]);
    if (res.rows.length === 0) return null;
    return this.mapDonationRow(res.rows[0]);
  }

  public async getDonationByPayPalOrderId(orderId: string): Promise<Donation | null> {
    const res = await this.pool.query('SELECT * FROM donations WHERE paypal_order_id = $1', [orderId]);
    if (res.rows.length === 0) return null;
    return this.mapDonationRow(res.rows[0]);
  }

  public async getDonationByCustomId(customId: string): Promise<Donation | null> {
    const res = await this.pool.query('SELECT * FROM donations WHERE paypal_custom_id = $1 OR id = $1', [customId]);
    if (res.rows.length === 0) return null;
    return this.mapDonationRow(res.rows[0]);
  }

  public async getDonationByCaptureId(captureId: string): Promise<Donation | null> {
    const res = await this.pool.query('SELECT * FROM donations WHERE paypal_capture_id = $1', [captureId]);
    if (res.rows.length === 0) return null;
    return this.mapDonationRow(res.rows[0]);
  }

  public async updateDonation(id: string, updates: any): Promise<Donation | null> {
    const sets: string[] = ['updated_at = NOW()'];
    const values: any[] = [id];
    let idx = 2;

    if (updates.status !== undefined) {
      sets.push(`status = $${idx++}`);
      values.push(updates.status);
    }
    if (updates.paypalOrderId !== undefined) {
      sets.push(`paypal_order_id = $${idx++}`);
      values.push(updates.paypalOrderId);
    }
    if (updates.paypalCaptureId !== undefined) {
      sets.push(`paypal_capture_id = $${idx++}`);
      values.push(updates.paypalCaptureId);
    }
    if (updates.completedAt !== undefined) {
      sets.push(`completed_at = $${idx++}`);
      values.push(updates.completedAt);
    }
    if (updates.metadata !== undefined) {
      sets.push(`metadata = $${idx++}`);
      values.push(JSON.stringify(updates.metadata));
    }

    const res = await this.pool.query(
      `UPDATE donations SET ${sets.join(', ')} WHERE id = $1 RETURNING *`,
      values
    );
    if (res.rows.length === 0) return null;
    return this.mapDonationRow(res.rows[0]);
  }

  public async listDonations(filters?: any): Promise<Donation[]> {
    let query = 'SELECT * FROM donations WHERE 1=1';
    const values: any[] = [];
    let idx = 1;

    if (filters?.mosqueId) {
      query += ` AND mosque_id = $${idx++}`;
      values.push(filters.mosqueId);
    }
    if (filters?.status) {
      query += ` AND status = $${idx++}`;
      values.push(filters.status);
    }
    if (filters?.startDate) {
      query += ` AND created_at >= $${idx++}`;
      values.push(filters.startDate);
    }
    if (filters?.endDate) {
      query += ` AND created_at <= $${idx++}`;
      values.push(filters.endDate);
    }

    query += ' ORDER BY created_at DESC';
    const res = await this.pool.query(query, values);
    return res.rows.map((r: any) => this.mapDonationRow(r));
  }

  public async getMosqueBalance(mosqueId: string): Promise<any> {
    const query = `
      SELECT
        COALESCE(SUM(CASE WHEN status = 'COMPLETED' OR (status = 'REFUNDED' AND completed_at IS NOT NULL) THEN amount ELSE 0 END), 0) AS completed,
        COALESCE(SUM(CASE WHEN status = 'REFUNDED' THEN amount ELSE 0 END), 0) AS refunded
      FROM donations WHERE mosque_id = $1;
    `;
    const payoutsQuery = `
      SELECT COALESCE(SUM(amount), 0) AS paid_out FROM payouts WHERE mosque_id = $1 AND status = 'PAID';
    `;

    const [donationsRes, payoutsRes] = await Promise.all([
      this.pool.query(query, [mosqueId]),
      this.pool.query(payoutsQuery, [mosqueId]),
    ]);

    const completed = parseFloat(donationsRes.rows[0].completed);
    const refunded = parseFloat(donationsRes.rows[0].refunded);
    const paidOut = parseFloat(payoutsRes.rows[0].paid_out);
    const remaining = Math.round((completed - refunded - paidOut) * 100) / 100;

    return {
      mosqueId,
      totalCompletedAmount: completed,
      totalRefundedAmount: refunded,
      totalPaidOutAmount: paidOut,
      remainingBalance: remaining,
    };
  }

  public async createPayout(params: any): Promise<any> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // Acquire transaction-level advisory lock on mosque ID to serialize payouts atomically
      await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [params.mosqueId]);
      await client.query('SELECT id FROM payouts WHERE mosque_id = $1 FOR UPDATE', [params.mosqueId]);

      const balanceRes = await client.query(`
        SELECT
          COALESCE(SUM(CASE WHEN status = 'COMPLETED' OR (status = 'REFUNDED' AND completed_at IS NOT NULL) THEN amount ELSE 0 END), 0) AS completed,
          COALESCE(SUM(CASE WHEN status = 'REFUNDED' THEN amount ELSE 0 END), 0) AS refunded
        FROM donations WHERE mosque_id = $1;
      `, [params.mosqueId]);

      const payoutsRes = await client.query(`
        SELECT COALESCE(SUM(amount), 0) AS paid_out FROM payouts WHERE mosque_id = $1 AND status = 'PAID';
      `, [params.mosqueId]);

      const completed = parseFloat(balanceRes.rows[0].completed);
      const refunded = parseFloat(balanceRes.rows[0].refunded);
      const paidOut = parseFloat(payoutsRes.rows[0].paid_out);
      const remaining = Math.round((completed - refunded - paidOut) * 100) / 100;

      const roundedAmount = Math.round(params.amount * 100) / 100;
      if (roundedAmount > remaining) {
        await client.query('ROLLBACK');
        return {
          success: false,
          error: `Payout of £${roundedAmount.toFixed(2)} exceeds available remaining balance of £${remaining.toFixed(2)}.`,
        };
      }

      const id = `MNM-PAY-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
      const insertQuery = `
        INSERT INTO payouts (
          id, mosque_id, mosque_name_snapshot, amount, currency, method, reference, notes, paid_at, created_at, created_by, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW(), $9, 'PAID')
        RETURNING *;
      `;
      const res = await client.query(insertQuery, [
        id,
        params.mosqueId,
        params.mosqueNameSnapshot || null,
        roundedAmount,
        (params.currency || 'GBP').toUpperCase(),
        params.method.trim(),
        params.reference.trim(),
        params.notes?.trim() || null,
        params.createdBy.trim(),
      ]);

      await client.query('COMMIT');
      return { success: true, payout: this.mapPayoutRow(res.rows[0]) };
    } catch (err: any) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  public async listPayouts(mosqueId?: string): Promise<Payout[]> {
    let query = 'SELECT * FROM payouts';
    const values: any[] = [];
    if (mosqueId) {
      query += ' WHERE mosque_id = $1';
      values.push(mosqueId);
    }
    query += ' ORDER BY created_at DESC';
    const res = await this.pool.query(query, values);
    return res.rows.map((r: any) => this.mapPayoutRow(r));
  }

  public async getAllMosqueLedgers(): Promise<MosqueLedger[]> {
    const query = `
      SELECT
        d.mosque_id,
        MAX(d.mosque_name_snapshot) AS mosque_name,
        COUNT(CASE WHEN d.status = 'COMPLETED' THEN 1 END) AS donation_count,
        COALESCE(SUM(CASE WHEN d.status = 'COMPLETED' OR (d.status = 'REFUNDED' AND d.completed_at IS NOT NULL) THEN d.amount ELSE 0 END), 0) AS total_completed,
        COALESCE(SUM(CASE WHEN d.status = 'REFUNDED' THEN d.amount ELSE 0 END), 0) AS total_refunded,
        MAX(d.created_at) AS last_donation_date
      FROM donations d
      GROUP BY d.mosque_id;
    `;
    const res = await this.pool.query(query);

    const payoutsRes = await this.pool.query(`
      SELECT mosque_id, COALESCE(SUM(amount), 0) AS total_paid
      FROM payouts WHERE status = 'PAID'
      GROUP BY mosque_id;
    `);

    const payoutsMap = new Map<string, number>();
    for (const r of payoutsRes.rows) {
      payoutsMap.set(r.mosque_id, parseFloat(r.total_paid));
    }

    return res.rows.map((r: any) => {
      const completed = parseFloat(r.total_completed);
      const refunded = parseFloat(r.total_refunded);
      const paid = payoutsMap.get(r.mosque_id) || 0;
      const remaining = Math.round((completed - refunded - paid) * 100) / 100;
      return {
        mosqueId: r.mosque_id,
        mosqueName: r.mosque_name,
        donationCount: parseInt(r.donation_count, 10),
        totalCompletedAmount: completed,
        totalRefundedAmount: refunded,
        totalPaidOutAmount: paid,
        remainingBalance: remaining,
        lastDonationDate: r.last_donation_date ? new Date(r.last_donation_date).toISOString() : undefined,
      };
    });
  }

  public async getOverallStats(): Promise<DonationStats> {
    const res = await this.pool.query(`
      SELECT
        COUNT(*) AS total,
        COUNT(CASE WHEN status = 'COMPLETED' OR (status = 'REFUNDED' AND completed_at IS NOT NULL) THEN 1 END) AS completed,
        COUNT(CASE WHEN status = 'PENDING' OR status = 'CREATED' THEN 1 END) AS pending,
        COUNT(CASE WHEN status = 'REFUNDED' THEN 1 END) AS refunded,
        COUNT(CASE WHEN status = 'FAILED' OR status = 'CANCELLED' THEN 1 END) AS failed,
        COALESCE(SUM(CASE WHEN status = 'COMPLETED' OR (status = 'REFUNDED' AND completed_at IS NOT NULL) THEN amount ELSE 0 END), 0) AS total_collected,
        COALESCE(SUM(CASE WHEN status = 'REFUNDED' THEN amount ELSE 0 END), 0) AS total_refunded
      FROM donations;
    `);

    const payoutsRes = await this.pool.query(`
      SELECT COALESCE(SUM(amount), 0) AS total_paid FROM payouts WHERE status = 'PAID';
    `);

    const row = res.rows[0];
    const totalCollected = parseFloat(row.total_collected);
    const totalRefunded = parseFloat(row.total_refunded);
    const totalPaid = parseFloat(payoutsRes.rows[0].total_paid);
    const remaining = Math.round((totalCollected - totalRefunded - totalPaid) * 100) / 100;

    return {
      totalDonations: parseInt(row.total, 10),
      completedDonations: parseInt(row.completed, 10),
      pendingDonations: parseInt(row.pending, 10),
      refundedDonations: parseInt(row.refunded, 10),
      failedDonations: parseInt(row.failed, 10),
      totalAmountCollected: totalCollected,
      totalAmountRefunded: totalRefunded,
      totalAmountPaidOut: totalPaid,
      totalRemainingBalance: remaining,
    };
  }

  // ── Webhook idempotency (persistent, multi-instance safe) ─────────────────
  // Uses the webhook_events table from schema.sql.
  // INSERT ... ON CONFLICT DO NOTHING is atomic — no race conditions.

  public async isWebhookEventProcessed(eventId: string): Promise<boolean> {
    const res = await this.pool.query(
      'SELECT 1 FROM webhook_events WHERE event_id = $1',
      [eventId]
    );
    return res.rows.length > 0;
  }

  public async markWebhookEventProcessed(
    eventId: string,
    eventType: string,
    donationId?: string
  ): Promise<void> {
    // ON CONFLICT DO NOTHING is atomic — safe for concurrent webhook deliveries
    await this.pool.query(
      `INSERT INTO webhook_events (event_id, event_type, donation_id, processed_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (event_id) DO NOTHING`,
      [eventId, eventType, donationId || null]
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Database Factory & Singleton Export
// ─────────────────────────────────────────────────────────────────────────────
export function createDatabase(): IDatabase {
  if (CONFIG.databaseUrl && CONFIG.databaseUrl.startsWith('postgres')) {
    console.log('🐘 Using PostgreSQL database connection from DATABASE_URL.');
    return new PostgresDatabase(CONFIG.databaseUrl);
  }
  if (CONFIG.nodeEnv === 'production') {
    throw new Error(
      '❌ FATAL: DATABASE_URL is required in production. MemoryDatabase is strictly prohibited in production to prevent data loss.'
    );
  }
  console.warn('⚠️  Warning: No DATABASE_URL provided. Using in-memory database (development/test only).');
  return new MemoryDatabase();
}

export const db: IDatabase = createDatabase();
