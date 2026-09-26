import { Router, Request, Response } from 'express';
import { db } from '../db';
import { verifyPayPalWebhookSignature } from '../paypal';

export const webhooksRouter = Router();

// POST /api/paypal/webhook
webhooksRouter.post('/', async (req: Request, res: Response) => {
  try {
    const rawBody = (req as any).rawBody || JSON.stringify(req.body);

    // 1. Verify PayPal webhook signature (cryptographic verification)
    const isValid = await verifyPayPalWebhookSignature({
      headers: req.headers as Record<string, string | string[] | undefined>,
      rawBody,
    });

    if (!isValid) {
      console.warn('[Webhook] Invalid PayPal webhook signature received — rejected.');
      return res.status(400).json({ error: 'Invalid webhook signature.' });
    }

    const event = req.body;
    const eventId: string | undefined = event.id;
    const eventType: string = event.event_type;
    const resource = event.resource;

    // 2. Persistent idempotency check — uses DB (PostgreSQL) or in-memory (dev)
    // This survives server restarts and works correctly with multiple instances.
    if (eventId) {
      const alreadyProcessed = await db.isWebhookEventProcessed(eventId);
      if (alreadyProcessed) {
        console.log(`[Webhook] Duplicate event — already processed: ${eventId} (${eventType})`);
        return res.status(200).json({ received: true, duplicate: true });
      }
    }

    console.log(`[Webhook] Processing PayPal event: ${eventType} (id=${eventId})`);

    // 3. Route on event type
    switch (eventType) {
      case 'PAYMENT.CAPTURE.COMPLETED': {
        const customId: string | undefined = resource.custom_id;
        const captureId: string | undefined = resource.id;

        // Locate donation by custom_id first, then by capture ID
        let donation = customId ? await db.getDonationByCustomId(customId) : null;
        if (!donation && captureId) {
          donation = await db.getDonationByCaptureId(captureId);
        }

        if (!donation) {
          console.warn(`[Webhook] COMPLETED: no donation found for customId=${customId} captureId=${captureId}`);
          break;
        }

        // Idempotency: already COMPLETED — skip, do not double-count
        if (donation.status === 'COMPLETED') {
          console.log(`[Webhook] Donation ${donation.id} already COMPLETED — skipping.`);
          break;
        }

        await db.updateDonation(donation.id, {
          status: 'COMPLETED',
          paypalCaptureId: captureId,
          completedAt: resource.create_time || new Date().toISOString(),
          metadata: { webhookEventId: eventId, webhookEvent: eventType },
        });
        console.log(`[Webhook] Donation ${donation.id} marked COMPLETED.`);
        break;
      }

      case 'PAYMENT.CAPTURE.PENDING': {
        // Capture is pending review (e.g. eCheck) — mark as PENDING
        const customId: string | undefined = resource.custom_id;
        const captureId: string | undefined = resource.id;

        let donation = customId ? await db.getDonationByCustomId(customId) : null;
        if (!donation && captureId) {
          donation = await db.getDonationByCaptureId(captureId);
        }

        if (donation && donation.status !== 'COMPLETED' && donation.status !== 'REFUNDED') {
          await db.updateDonation(donation.id, {
            status: 'PENDING',
            metadata: { webhookEventId: eventId, webhookEvent: eventType, pendingReason: resource.status_details?.reason },
          });
          console.log(`[Webhook] Donation ${donation.id} marked PENDING.`);
        }
        break;
      }

      case 'PAYMENT.CAPTURE.REFUNDED': {
        // Use the related capture to find the donation
        const captureId: string | undefined = resource.links
          ?.find((l: any) => l.rel === 'up')
          ?.href?.split('/')
          .pop() || resource.id;

        let donation = await db.getDonationByCaptureId(captureId || '');
        if (!donation) {
          // Fallback: try custom_id from resource
          const customId: string | undefined = resource.custom_id;
          if (customId) donation = await db.getDonationByCustomId(customId);
        }

        if (!donation) {
          console.warn(`[Webhook] REFUNDED: no donation found for captureId=${captureId}`);
          break;
        }

        // Idempotency: already REFUNDED
        if (donation.status === 'REFUNDED') {
          console.log(`[Webhook] Donation ${donation.id} already REFUNDED — skipping.`);
          break;
        }

        await db.updateDonation(donation.id, {
          status: 'REFUNDED',
          metadata: {
            webhookEventId: eventId,
            webhookEvent: eventType,
            refundedAt: new Date().toISOString(),
            refundId: resource.id,
          },
        });
        console.log(`[Webhook] Donation ${donation.id} marked REFUNDED.`);
        break;
      }

      case 'PAYMENT.CAPTURE.DENIED': {
        const customId: string | undefined = resource.custom_id;
        const captureId: string | undefined = resource.id;

        let donation = customId ? await db.getDonationByCustomId(customId) : null;
        if (!donation && captureId) {
          donation = await db.getDonationByCaptureId(captureId);
        }

        if (donation && donation.status !== 'COMPLETED' && donation.status !== 'REFUNDED') {
          await db.updateDonation(donation.id, {
            status: 'FAILED',
            metadata: { webhookEventId: eventId, webhookEvent: eventType, deniedAt: new Date().toISOString() },
          });
          console.log(`[Webhook] Donation ${donation.id} marked FAILED (DENIED).`);
        }
        break;
      }

      case 'CHECKOUT.ORDER.APPROVED': {
        // Donor approved order on PayPal.
        // DO NOT mark COMPLETED. Only update status from CREATED to PENDING.
        // The payment is only completed once capturePayPalOrder succeeds.
        const orderId: string | undefined = resource.id;
        const customId: string | undefined = resource.purchase_units?.[0]?.custom_id;

        let donation = customId ? await db.getDonationByCustomId(customId) : null;
        if (!donation && orderId) {
          donation = await db.getDonationByPayPalOrderId(orderId);
        }

        if (donation && donation.status === 'CREATED') {
          await db.updateDonation(donation.id, {
            status: 'PENDING',
            metadata: { webhookEventId: eventId, webhookEvent: eventType },
          });
          console.log(`[Webhook] Donation ${donation.id} updated to PENDING via CHECKOUT.ORDER.APPROVED.`);
        }
        break;
      }

      default:
        // Other events acknowledged
        console.log(`[Webhook] Unhandled event type '${eventType}' acknowledged.`);
        break;
    }

    // Mark event as processed in DB (persists across restarts, multi-instance safe)
    if (eventId) {
      await db.markWebhookEventProcessed(eventId, eventType);
    }

    return res.status(200).json({ received: true });
  } catch (error: any) {
    console.error('[Webhook] Error handling PayPal webhook:', error);
    // Return 500 so PayPal will retry — but only after signature is verified
    return res.status(500).json({ error: 'Webhook processing failed.' });
  }
});
