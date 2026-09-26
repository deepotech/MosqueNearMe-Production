import { Router, Request, Response } from 'express';
import { db } from '../db';
import { CONFIG } from '../config';
import { createPayPalOrder, capturePayPalOrder } from '../paypal';
import { getVerifiedMosque } from '../mosque-validator';
import { orderCreationLimiter } from '../rate-limiter';

export const donationsRouter = Router();

// POST /api/donations/create-order
donationsRouter.post('/create-order', orderCreationLimiter, async (req: Request, res: Response) => {
  try {
    const {
      mosqueId,
      amount,
      currency,
      isAnonymous,
      donorName,
      donorEmail,
      donationType,
    } = req.body;

    // 1. Mosque Validation against verified registry
    if (!mosqueId || typeof mosqueId !== 'string') {
      return res.status(400).json({ error: 'A valid mosqueId is required.' });
    }

    const verifiedMosque = getVerifiedMosque(mosqueId);
    if (!verifiedMosque) {
      return res.status(400).json({ error: 'Invalid or unknown mosque.' });
    }

    // 2. Currency Validation (Only GBP supported)
    const reqCurrency = (currency || CONFIG.donation.currency).toUpperCase();
    if (reqCurrency !== 'GBP') {
      return res.status(400).json({ error: 'Invalid currency. Only GBP (£) is supported.' });
    }

    // 3. Amount Validation
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || !isFinite(numAmount) || numAmount < CONFIG.donation.minAmount) {
      return res.status(400).json({
        error: `Minimum donation amount is £${CONFIG.donation.minAmount.toFixed(2)}.`,
      });
    }
    if (numAmount > CONFIG.donation.maxAmount) {
      return res.status(400).json({
        error: `Maximum donation amount is £${CONFIG.donation.maxAmount.toFixed(2)}.`,
      });
    }

    const roundedAmount = Math.round(numAmount * 100) / 100;

    // 4. Privacy: If anonymous, discard name and email entirely
    const anon = Boolean(isAnonymous);
    const sanitizedDonorName = anon ? undefined : typeof donorName === 'string' ? donorName.trim().slice(0, 100) : undefined;
    const sanitizedDonorEmail = anon ? undefined : typeof donorEmail === 'string' ? donorEmail.trim().slice(0, 150) : undefined;

    // 5. Create pending record in DB with our internal ID
    const donation = await db.createDonation({
      mosqueId: verifiedMosque.id,
      mosqueSlug: verifiedMosque.slug,
      mosqueNameSnapshot: verifiedMosque.name, // Sourced from verified registry
      amount: roundedAmount,
      currency: 'GBP',
      donationType: donationType === 'MONTHLY' ? 'MONTHLY' : 'ONE_TIME',
      isAnonymous: anon,
      donorName: sanitizedDonorName,
      donorEmail: sanitizedDonorEmail,
    });

    // 6. Create PayPal Order linked with custom_id = donation.id
    const paypalOrder = await createPayPalOrder({
      donationId: donation.id,
      mosqueId: donation.mosqueId,
      mosqueName: donation.mosqueNameSnapshot,
      amount: donation.amount,
      currency: donation.currency,
    });

    if (!paypalOrder.approveUrl) {
      throw new Error('PayPal Order created but no approval URL was returned.');
    }

    // 7. Update database record with PayPal Order ID
    await db.updateDonation(donation.id, {
      paypalOrderId: paypalOrder.orderId,
      status: 'PENDING',
    });

    return res.status(201).json({
      success: true,
      donationId: donation.id,
      paypalOrderId: paypalOrder.orderId,
      approveUrl: paypalOrder.approveUrl,
      amount: donation.amount,
      currency: donation.currency,
    });
  } catch (error: any) {
    console.error('Error creating donation order:', error);
    return res.status(500).json({
      error: 'Failed to create donation order.',
      details: error.message,
    });
  }
});

// POST /api/donations/capture-order
donationsRouter.post('/capture-order', async (req: Request, res: Response) => {
  try {
    const { donationId, orderId, token } = req.body;
    const effectiveOrderId = orderId || token;

    if (!effectiveOrderId) {
      return res.status(400).json({ error: 'orderId (or token) is required.' });
    }

    // 1. Locate donation record
    let donation = donationId ? await db.getDonationById(donationId) : null;
    if (!donation) {
      donation = await db.getDonationByPayPalOrderId(effectiveOrderId);
    }
    if (!donation) {
      return res.status(404).json({ error: 'Donation record not found for this order.' });
    }

    // Security check: ensure order ID matches donation record
    if (donation.paypalOrderId && donation.paypalOrderId !== effectiveOrderId) {
      return res.status(400).json({ error: 'Order ID does not match this donation record.' });
    }

    // 2. Idempotency: If already completed, return immediately without capturing twice
    if (donation.status === 'COMPLETED') {
      return res.json({
        success: true,
        alreadyProcessed: true,
        donationId: donation.id,
        status: donation.status,
        captureId: donation.paypalCaptureId,
        amount: donation.amount,
        currency: donation.currency,
        mosqueName: donation.mosqueNameSnapshot,
      });
    }

    // 3. Capture through PayPal server-side API
    const captureResult = await capturePayPalOrder(effectiveOrderId);

    if (captureResult.status !== 'COMPLETED') {
      await db.updateDonation(donation.id, {
        status: 'FAILED',
        metadata: { captureResult },
      });
      return res.status(400).json({
        error: `PayPal payment could not be completed (Status: ${captureResult.status}).`,
      });
    }

    // 4. Server-Side Reconciliation Check: Verify currency, amount & custom_id match
    if (captureResult.customId && captureResult.customId !== donation.id) {
      console.error(`custom_id mismatch: expected ${donation.id}, got ${captureResult.customId}`);
      await db.updateDonation(donation.id, {
        status: 'FAILED',
        metadata: { error: 'custom_id mismatch during capture', captureResult },
      });
      return res.status(400).json({ error: 'PayPal custom_id does not match donation record.' });
    }

    if (captureResult.currency !== donation.currency || captureResult.amount !== donation.amount) {
      console.error(`Amount mismatch: expected ${donation.amount} ${donation.currency}, got ${captureResult.amount} ${captureResult.currency}`);
      await db.updateDonation(donation.id, {
        status: 'FAILED',
        metadata: { error: 'Amount mismatch during capture', captureResult },
      });
      return res.status(400).json({ error: 'Payment amount mismatch detected.' });
    }

    // 5. Mark donation COMPLETED with Capture ID
    const updated = await db.updateDonation(donation.id, {
      status: 'COMPLETED',
      paypalCaptureId: captureResult.captureId,
      completedAt: new Date().toISOString(),
      metadata: { captureId: captureResult.captureId },
    });

    return res.json({
      success: true,
      donationId: updated?.id,
      status: 'COMPLETED',
      captureId: captureResult.captureId,
      amount: donation.amount,
      currency: donation.currency,
      mosqueName: donation.mosqueNameSnapshot,
    });
  } catch (error: any) {
    console.error('Error capturing donation order:', error);
    return res.status(500).json({
      error: 'Failed to capture donation payment.',
      details: error.message,
    });
  }
});

// GET /api/donations/:id
donationsRouter.get('/:id', async (req: Request, res: Response) => {
  const donation = await db.getDonationById(String(req.params.id || ''));
  if (!donation) {
    return res.status(404).json({ error: 'Donation not found.' });
  }

  // Return public safe view (no secrets, respect privacy)
  return res.json({
    id: donation.id,
    mosqueId: donation.mosqueId,
    mosqueName: donation.mosqueNameSnapshot,
    amount: donation.amount,
    currency: donation.currency,
    status: donation.status,
    isAnonymous: donation.isAnonymous,
    donorName: donation.isAnonymous ? 'Anonymous' : donation.donorName,
    createdAt: donation.createdAt,
    completedAt: donation.completedAt,
  });
});
