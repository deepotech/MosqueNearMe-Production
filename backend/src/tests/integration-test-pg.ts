/**
 * integration-test-pg.ts
 *
 * PostgreSQL integration tests — run only when TEST_DATABASE_URL is set.
 * Uses a real PostgreSQL connection to verify the full database layer.
 *
 * Usage:
 *   TEST_DATABASE_URL=postgresql://... npx tsx src/tests/integration-test-pg.ts
 *
 * This test:
 *   1. Creates tables via schema.sql (idempotent — IF NOT EXISTS)
 *   2. Runs create/update/query operations
 *   3. Tests webhook idempotency (persistent across "restarts")
 *   4. Tests atomic payout transaction (concurrent race condition)
 *   5. Cleans up all test data afterwards
 *
 * IMPORTANT: Use a separate test database. Never run against production.
 */

import fs from 'fs';
import path from 'path';
import { PostgresDatabase } from '../db';

const TEST_DB_URL = process.env.TEST_DATABASE_URL;

if (!TEST_DB_URL) {
  console.log('\n⏭  Skipping PostgreSQL integration tests: TEST_DATABASE_URL not set.');
  console.log('   To run: TEST_DATABASE_URL=postgresql://... npx tsx src/tests/integration-test-pg.ts\n');
  process.exit(0);
}

async function runPgIntegrationTests() {
  console.log('\n=======================================================');
  console.log('🐘 MosqueNearMe — PostgreSQL Integration Tests');
  console.log(`   DB: ${TEST_DB_URL!.replace(/:([^:@]+)@/, ':***@')}`);
  console.log('=======================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, message: string) {
    if (condition) {
      console.log(`  ✓ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${message}`);
      failed++;
    }
  }

  const db = new PostgresDatabase(TEST_DB_URL!);

  // ── Apply schema (IF NOT EXISTS — safe to run repeatedly) ─────────────────
  console.log('[Setup] Applying schema.sql...');
  const schemaPath = path.resolve(__dirname, '..', 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf-8');

  // Access pool for setup/teardown (not part of IDatabase interface)
  const pool = (db as any).pool;
  await pool.query(schemaSql);
  console.log('[Setup] Schema applied.\n');

  // ── Cleanup helper ─────────────────────────────────────────────────────────
  const testPrefix = `TEST-${Date.now()}`;
  async function cleanup() {
    await pool.query(`DELETE FROM webhook_events WHERE event_id LIKE $1`, [`${testPrefix}%`]);
    await pool.query(`DELETE FROM payouts WHERE mosque_id = $1`, [`pg-test-mosque`]);
    await pool.query(`DELETE FROM donations WHERE mosque_id = $1`, [`pg-test-mosque`]);
    console.log('\n[Cleanup] Test data removed.');
  }

  try {
    // ── 1. Create Donation ─────────────────────────────────────────────────
    console.log('[1] Create Donation');
    const donation = await db.createDonation({
      mosqueId: 'pg-test-mosque',
      mosqueSlug: 'pg-test-mosque-slug',
      mosqueNameSnapshot: 'PG Test Mosque',
      amount: 50.0,
      currency: 'GBP',
      isAnonymous: true,
    });
    assert(donation.id.startsWith('MNM-DON-'), 'Donation ID format correct');
    assert(donation.status === 'CREATED', 'Initial status is CREATED');
    assert(donation.paypalCustomId === donation.id, 'custom_id === donation.id');
    assert(donation.amount === 50.0, 'Amount stored correctly');
    assert(donation.isAnonymous === true, 'Anonymous flag stored');

    // ── 2. Update Donation ─────────────────────────────────────────────────
    console.log('\n[2] Update Donation');
    const mockOrderId = `PPORDER-${Date.now()}`;
    await db.updateDonation(donation.id, { paypalOrderId: mockOrderId, status: 'PENDING' });
    const pending = await db.getDonationById(donation.id);
    assert(pending?.status === 'PENDING', 'Status updated to PENDING');
    assert(pending?.paypalOrderId === mockOrderId, 'PayPal order ID stored');

    const mockCaptureId = `PPCAPTURE-${Date.now()}`;
    await db.updateDonation(donation.id, {
      status: 'COMPLETED',
      paypalCaptureId: mockCaptureId,
      completedAt: new Date().toISOString(),
    });
    const completed = await db.getDonationById(donation.id);
    assert(completed?.status === 'COMPLETED', 'Status updated to COMPLETED');
    assert(completed?.paypalCaptureId === mockCaptureId, 'Capture ID stored');
    assert(Boolean(completed?.completedAt), 'completedAt set');

    // ── 3. Lookup Methods ──────────────────────────────────────────────────
    console.log('\n[3] Lookup Methods');
    const byOrder = await db.getDonationByPayPalOrderId(mockOrderId);
    assert(byOrder?.id === donation.id, 'getDonationByPayPalOrderId works');

    const byCapture = await db.getDonationByCaptureId(mockCaptureId);
    assert(byCapture?.id === donation.id, 'getDonationByCaptureId works');

    const byCustomId = await db.getDonationByCustomId(donation.id);
    assert(byCustomId?.id === donation.id, 'getDonationByCustomId works');

    // ── 4. Webhook Idempotency ─────────────────────────────────────────────
    console.log('\n[4] Webhook Idempotency — Persistent');
    const eventId = `${testPrefix}-WH-001`;

    const notYet = await db.isWebhookEventProcessed(eventId);
    assert(!notYet, 'Event not yet processed (before mark)');

    await db.markWebhookEventProcessed(eventId, 'PAYMENT.CAPTURE.COMPLETED', donation.id);
    const nowProcessed = await db.isWebhookEventProcessed(eventId);
    assert(nowProcessed, 'Event marked as processed');

    // Simulate duplicate: mark same event again — must not throw (ON CONFLICT DO NOTHING)
    await db.markWebhookEventProcessed(eventId, 'PAYMENT.CAPTURE.COMPLETED', donation.id);
    const stillProcessed = await db.isWebhookEventProcessed(eventId);
    assert(stillProcessed, 'Duplicate mark safe (ON CONFLICT DO NOTHING)');

    // ── 5. Balance Calculation ─────────────────────────────────────────────
    console.log('\n[5] Balance Calculation');
    const balance = await db.getMosqueBalance('pg-test-mosque');
    assert(balance.totalCompletedAmount === 50.0, 'Completed amount = £50');
    assert(balance.remainingBalance === 50.0, 'Remaining balance = £50');
    assert(balance.totalPaidOutAmount === 0, 'No payouts yet');

    // ── 6. Atomic Payout Transaction ───────────────────────────────────────
    console.log('\n[6] Atomic Payout Transaction');

    // Reject payout exceeding balance
    const reject = await db.createPayout({
      mosqueId: 'pg-test-mosque',
      amount: 100.0,
      method: 'Bank Transfer',
      reference: 'PG-TEST-REF-001',
      createdBy: 'test',
    });
    assert(reject.success === false, 'Payout exceeding balance rejected');

    // Accept valid payout
    const accept = await db.createPayout({
      mosqueId: 'pg-test-mosque',
      amount: 50.0,
      method: 'Bank Transfer',
      reference: 'PG-TEST-REF-002',
      createdBy: 'test',
    });
    assert(accept.success === true, 'Valid payout accepted');

    const balanceAfter = await db.getMosqueBalance('pg-test-mosque');
    assert(balanceAfter.remainingBalance === 0, 'Balance = 0 after full payout');
    assert(balanceAfter.totalPaidOutAmount === 50.0, 'Paid out = £50');

    // ── 7. Concurrent Payouts Race Condition ───────────────────────────────
    console.log('\n[7] Concurrent Payouts — Race Condition (Postgres FOR UPDATE)');

    // Add another £100 donation
    const d2 = await db.createDonation({
      mosqueId: 'pg-test-mosque',
      mosqueSlug: 'pg-test-mosque-slug',
      mosqueNameSnapshot: 'PG Test Mosque',
      amount: 100.0,
      currency: 'GBP',
    });
    await db.updateDonation(d2.id, {
      status: 'COMPLETED',
      completedAt: new Date().toISOString(),
    });

    // Fire two concurrent payouts of £75 each — only one should succeed
    const [c1, c2] = await Promise.all([
      db.createPayout({
        mosqueId: 'pg-test-mosque',
        amount: 75.0,
        method: 'Bank Transfer',
        reference: 'PG-RACE-001',
        createdBy: 'test',
      }),
      db.createPayout({
        mosqueId: 'pg-test-mosque',
        amount: 75.0,
        method: 'Bank Transfer',
        reference: 'PG-RACE-002',
        createdBy: 'test',
      }),
    ]);

    const successCount = [c1, c2].filter((r) => r.success).length;
    assert(successCount === 1, 'Exactly one concurrent payout succeeds (FOR UPDATE lock)');

    const finalBalance = await db.getMosqueBalance('pg-test-mosque');
    assert(finalBalance.remainingBalance === 25.0, 'Final balance = £25 (no over-payment)');

  } finally {
    await cleanup();
    await pool.end();
  }

  console.log('\n───────────────────────────────────────────────────────');
  console.log(`Results: ${passed} passed, ${failed} failed.`);
  console.log('───────────────────────────────────────────────────────\n');

  if (failed > 0) process.exit(1);
}

runPgIntegrationTests().catch((err) => {
  console.error('Fatal integration test error:', err);
  process.exit(1);
});
