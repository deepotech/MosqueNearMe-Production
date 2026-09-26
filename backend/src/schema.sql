-- ─────────────────────────────────────────────────────────────────────────────
-- MosqueNearMe Donation System — PostgreSQL Schema
-- ─────────────────────────────────────────────────────────────────────────────
-- Run once against your PostgreSQL database:
--   psql $DATABASE_URL -f src/schema.sql
-- Or via npm:
--   npm run db:init
--
-- Tables:
--   donations      — every donation attempt with full PayPal reconciliation data
--   payouts        — admin-recorded payouts per mosque
--   webhook_events — idempotency table for PayPal webhook events
--
-- Mosque data is NOT stored here; it is served statically from mosques.json.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── donations ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS donations (
  -- Internal identifier: MNM-DON-XXXXXXXX
  id                   VARCHAR(64)   PRIMARY KEY,

  -- Mosque reference (read-only snapshot; source of truth is mosques.json)
  mosque_id            VARCHAR(64)   NOT NULL,
  mosque_slug          VARCHAR(255)  NOT NULL,
  mosque_name_snapshot VARCHAR(255)  NOT NULL,

  -- Financial fields — NUMERIC avoids floating-point errors
  amount               NUMERIC(10, 2) NOT NULL CHECK (amount >= 1.00 AND amount <= 5000.00),
  currency             VARCHAR(10)   NOT NULL DEFAULT 'GBP',
  donation_type        VARCHAR(20)   NOT NULL DEFAULT 'ONE_TIME'
                         CHECK (donation_type IN ('ONE_TIME', 'MONTHLY')),

  -- Lifecycle status
  status               VARCHAR(20)   NOT NULL DEFAULT 'CREATED'
                         CHECK (status IN ('CREATED','PENDING','COMPLETED','FAILED','CANCELLED','REFUNDED')),

  -- PayPal reconciliation fields
  -- paypal_order_id  → links to PayPal Order (from create-order)
  -- paypal_capture_id → links to PayPal Capture (from capture-order or webhook)
  -- paypal_custom_id  → equals id; used to match webhook events back to our record
  paypal_order_id      VARCHAR(128)  UNIQUE,
  paypal_capture_id    VARCHAR(128)  UNIQUE,
  paypal_custom_id     VARCHAR(128)  NOT NULL,

  -- Privacy: only stored if donor explicitly provides and is not anonymous
  is_anonymous         BOOLEAN       NOT NULL DEFAULT FALSE,
  donor_name           VARCHAR(255),
  donor_email          VARCHAR(255),

  -- Timestamps (all UTC)
  created_at           TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  completed_at         TIMESTAMPTZ,
  updated_at           TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  -- Raw PayPal response / webhook event data for audit
  metadata             JSONB
);

-- ── payouts ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payouts (
  -- Internal identifier: MNM-PAY-XXXXXXXX
  id                   VARCHAR(64)   PRIMARY KEY,

  mosque_id            VARCHAR(64)   NOT NULL,
  mosque_name_snapshot VARCHAR(255),

  amount               NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
  currency             VARCHAR(10)   NOT NULL DEFAULT 'GBP',

  -- How the payout was made (e.g. "Bank Transfer", "PayPal")
  method               VARCHAR(64)   NOT NULL,
  -- External reference (bank ref, PayPal transaction ID, etc.)
  reference            VARCHAR(128)  NOT NULL,
  notes                TEXT,

  paid_at              TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  created_at           TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  created_by           VARCHAR(128)  NOT NULL,

  -- Only 'PAID' supported for now; reserved for future PENDING/CANCELLED states
  status               VARCHAR(20)   NOT NULL DEFAULT 'PAID'
);

-- ── webhook_events ────────────────────────────────────────────────────────────
-- Persistent idempotency store for PayPal webhook events.
-- Prevents duplicate processing across server restarts and multiple instances.
-- The in-memory Set in webhooks.ts handles within a single process;
-- this table is the durable fallback for multi-instance / restart scenarios.
CREATE TABLE IF NOT EXISTS webhook_events (
  -- PayPal webhook event ID (e.g. "WH-XXXX...")
  event_id             VARCHAR(128)  PRIMARY KEY,
  event_type           VARCHAR(128)  NOT NULL,
  donation_id          VARCHAR(64),
  processed_at         TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ── Indexes ───────────────────────────────────────────────────────────────────
-- Donations: fast lookups for webhook matching and ledger aggregation
CREATE INDEX IF NOT EXISTS idx_donations_mosque_id     ON donations(mosque_id);
CREATE INDEX IF NOT EXISTS idx_donations_status        ON donations(status);
CREATE INDEX IF NOT EXISTS idx_donations_created_at    ON donations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_donations_paypal_order  ON donations(paypal_order_id);
CREATE INDEX IF NOT EXISTS idx_donations_paypal_capture ON donations(paypal_capture_id);
CREATE INDEX IF NOT EXISTS idx_donations_paypal_custom ON donations(paypal_custom_id);

-- Payouts: fast ledger sums
CREATE INDEX IF NOT EXISTS idx_payouts_mosque_id       ON payouts(mosque_id);
CREATE INDEX IF NOT EXISTS idx_payouts_status          ON payouts(status);

-- Webhook events: fast idempotency check
-- PRIMARY KEY on event_id already creates an index; no extra needed.
