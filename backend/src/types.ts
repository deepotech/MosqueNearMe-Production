export type DonationType = 'ONE_TIME' | 'MONTHLY';

export type DonationStatus =
  | 'CREATED'
  | 'PENDING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'
  | 'REFUNDED';

export interface Donation {
  id: string; // e.g. "MNM-DON-xxxxxxxx"
  mosqueId: string;
  mosqueSlug: string;
  mosqueNameSnapshot: string;
  amount: number;
  currency: string; // e.g. "GBP"
  donationType: DonationType;
  status: DonationStatus;
  paypalOrderId?: string;
  paypalCaptureId?: string;
  paypalCustomId: string;
  isAnonymous: boolean;
  donorName?: string;
  donorEmail?: string;
  createdAt: string; // ISO 8601
  completedAt?: string; // ISO 8601
  updatedAt: string; // ISO 8601
  metadata?: Record<string, unknown>;
}

export interface Payout {
  id: string; // e.g. "MNM-PAY-xxxxxxxx"
  mosqueId: string;
  mosqueNameSnapshot?: string;
  amount: number;
  currency: string; // e.g. "GBP"
  method: string; // e.g. "Bank Transfer"
  reference: string; // e.g. "MNE-PAYOUT-2026-001"
  notes?: string;
  paidAt: string; // ISO 8601 date or string
  createdAt: string; // ISO 8601
  createdBy: string;
  status: 'PAID';
}

export interface MosqueLedger {
  mosqueId: string;
  mosqueName: string;
  donationCount: number;
  totalCompletedAmount: number;
  totalRefundedAmount: number;
  totalPaidOutAmount: number;
  remainingBalance: number;
  lastDonationDate?: string;
}

export interface DonationStats {
  totalDonations: number;
  completedDonations: number;
  pendingDonations: number;
  refundedDonations: number;
  failedDonations: number;
  totalAmountCollected: number;
  totalAmountRefunded: number;
  totalAmountPaidOut: number;
  totalRemainingBalance: number;
}
