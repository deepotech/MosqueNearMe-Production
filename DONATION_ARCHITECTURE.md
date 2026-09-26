# MosqueNearMe Donation System Architecture

## 1. Executive Summary & Design Principles

The MosqueNearMe website (https://mosquenearme.net) is and must remain a **100% Static Export** (`output: 'export'`) hosted on static web hosting (Hostinger `public_html/`). It requires zero Node.js server runtime on the main domain.

To provide a secure, trustworthy, and fully traceable donation system:
1. **Frontend**: Static Next.js pages (`/donate`, `/donate/success`, `/donate/cancel`, and a subtle Donate CTA on `/mosques/[slug]`).
2. **Backend**: A small, standalone, lightweight Node.js service (`backend/`) hosted independently (e.g. Railway, Render, Fly.io, or VPS).
3. **Database**: A lightweight transactional database located exclusively in the external backend, storing only donation records and manual payout logs (no duplication of the 2,183 static mosques).
4. **PayPal Architecture**: Exactly **ONE centralized PayPal Business account** belonging to MosqueNearMe. No individual PayPal accounts for mosques.
5. **Traceability**: Each donation is identified by a unique internal code (e.g. `MNM-DON-xxxxxxxx`). This code is embedded directly into PayPal as `custom_id`, permanently tying the financial transaction in PayPal to the chosen mosque and our database record.

```
┌────────────────────────────────────────────────────────┐
│             MosqueNearMe Static Website                │
│             (Hostinger Static Hosting)                 │
│  - Pure HTML/CSS/JS (output: 'export')                 │
│  - 2,183 Mosques loaded from MosquesNov25Extended.csv   │
│  - /donate page with instant client-side mosque search │
└──────────────────────────┬─────────────────────────────┘
                           │ HTTPS API Requests
                           ▼
┌────────────────────────────────────────────────────────┐
│            Small External Donation Backend             │
│            (Render / Railway / Fly.io / VPS)           │
│  - Node.js + Express + TypeScript                      │
│  - PayPal REST API v2 Integration                      │
│  - Webhook Listener with Signature Verification        │
│  - Idempotent Processing & Server-Side Validation      │
│  - Protected Admin API & Dashboard                     │
└──────────────┬──────────────────────────┬──────────────┘
               │                          │
               ▼                          ▼
┌─────────────────────────────┐  ┌──────────────────────────────────┐
│  Lightweight Backend DB     │  │   Official PayPal Business API   │
│  - Donations table          │  │   - Orders v2 (create & capture) │
│  - Payouts table            │  │   - custom_id = MNM-DON-xxxxxxxx │
│  - Ledger balance calc      │  │   - Sandbox / Live environments  │
└─────────────────────────────┘  └──────────────────────────────────┘
```

---

## 2. Static Frontend Architecture

### 2.1 Preserving Static Generation
* `next.config.ts` retains `output: 'export'` and `trailingSlash: true`.
* Mosque details, cities, and sitemaps continue to build to static files in `out/`.
* The donation flow is purely client-driven:
  * `/donate`: Form that loads mosques from `public/mosques.json` (already pre-generated).
  * Mosque search by name, city, or postcode runs instantaneously in the client browser with zero latency.
  * Deep-link support: `/donate?mosque=<slug-or-id>` pre-selects the mosque seamlessly.
  * When the user picks a donation amount (£5, £10, £25, £50, or custom) and clicks PayPal, the frontend sends a `POST` request to the external backend (`NEXT_PUBLIC_DONATION_API_URL/api/donations/create-order`).

### 2.2 Environment Variables (Frontend)
```env
# URL of the external donation backend
NEXT_PUBLIC_DONATION_API_URL=http://localhost:4000
# PayPal Client ID for the JavaScript SDK (Public, Safe for browser)
NEXT_PUBLIC_PAYPAL_CLIENT_ID=your_paypal_sandbox_client_id
```

---

## 3. External Donation Backend Architecture

The backend lives in `backend/` as an independent microservice with its own `package.json`.

### 3.1 Tech Stack
* **Runtime**: Node.js (v18+) with TypeScript.
* **Framework**: Express.js with CORS, Helmet, and Rate Limiting.
* **Database**: SQLite via `better-sqlite3` or atomic JSON ledger with ACID safety, easily swappable with PostgreSQL via connection string.
* **PayPal SDK / HTTP**: Official PayPal REST API v2 endpoints via standard HTTPS fetch (recommended by PayPal over deprecated SDKs).

### 3.2 Database Schema (Minimal & Focused)

#### `donations` Table
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | TEXT PRIMARY KEY | Internal ID (`MNM-DON-xxxxxxxx`) |
| `mosqueId` | TEXT NOT NULL | Stable mosque ID from dataset |
| `mosqueSlug` | TEXT NOT NULL | Permanent slug (e.g. `birmingham-central-mosque`) |
| `mosqueNameSnapshot` | TEXT NOT NULL | Name of the mosque at time of donation |
| `amount` | REAL NOT NULL | Decimal amount (e.g. 25.00) |
| `currency` | TEXT NOT NULL | Default: `GBP` |
| `donationType` | TEXT NOT NULL | `ONE_TIME` (default) or `MONTHLY` |
| `status` | TEXT NOT NULL | `CREATED`, `PENDING`, `COMPLETED`, `FAILED`, `REFUNDED`, `CANCELLED` |
| `paypalOrderId` | TEXT UNIQUE | PayPal Order ID (e.g. `5O190127TN364715T`) |
| `paypalCaptureId` | TEXT UNIQUE | PayPal Capture ID (e.g. `2C679366TH822453X`) |
| `paypalCustomId` | TEXT NOT NULL | Identical to `id` (`MNM-DON-xxxxxxxx`) |
| `isAnonymous` | INTEGER NOT NULL | 1 (true) or 0 (false) |
| `donorName` | TEXT | Optional donor name |
| `donorEmail` | TEXT | Optional donor email |
| `createdAt` | TEXT NOT NULL | ISO timestamp |
| `completedAt` | TEXT | ISO timestamp when captured |
| `updatedAt` | TEXT NOT NULL | ISO timestamp |

#### `payouts` Table
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | TEXT PRIMARY KEY | Payout ID (`MNM-PAY-xxxxxxxx`) |
| `mosqueId` | TEXT NOT NULL | Target mosque ID |
| `amount` | REAL NOT NULL | Payout amount |
| `currency` | TEXT NOT NULL | `GBP` |
| `method` | TEXT NOT NULL | e.g. `Bank Transfer`, `Cheque`, `Cash` |
| `reference` | TEXT NOT NULL | Banking reference (e.g. `MNE-2026-001`) |
| `notes` | TEXT | Optional admin notes |
| `paidAt` | TEXT NOT NULL | Date paid |
| `createdAt` | TEXT NOT NULL | Timestamp created |
| `createdBy` | TEXT NOT NULL | Admin identifier |

---

## 4. Financial Reconciliation & Ledger Calculation

We never store a mutable static `balance` column. The remaining balance for any mosque is always derived dynamically:

$$\text{Available Balance} = \sum(\text{COMPLETED Donations}) - \sum(\text{REFUNDED Donations}) - \sum(\text{PAID Payouts})$$

### Strict Validation Rules:
1. An admin cannot record a payout exceeding the current `Available Balance`.
2. PayPal amounts are verified server-side against the initial order before capturing.
3. If PayPal returns a different currency or amount, the capture is rejected and marked `FAILED`.

---

## 5. PayPal Flow & `custom_id` Traceability

```
1. Visitor selects "East London Mosque", amount £25.00
   │
2. Frontend calls POST /api/donations/create-order
   │ Payload: { mosqueId: "123", mosqueSlug: "...", mosqueName: "...", amount: 25.00, isAnonymous: false }
   │
3. Backend validates:
   - Valid mosque ID
   - £1.00 <= amount <= £5000.00
   - Generates internal ID: "MNM-DON-a8f3b2c1"
   - Inserts record into `donations` with status: "CREATED"
   │
4. Backend calls PayPal REST API v2:
   POST /v2/checkout/orders
   {
     "intent": "CAPTURE",
     "purchase_units": [{
       "reference_id": "default",
       "custom_id": "MNM-DON-a8f3b2c1",
       "description": "Donation for East London Mosque via MosqueNearMe",
       "amount": { "currency_code": "GBP", "value": "25.00" }
     }]
   }
   PayPal returns: { "id": "ORDER-98765", "status": "CREATED" }
   Backend updates donation with paypalOrderId = "ORDER-98765" and returns orderId to frontend.
   │
5. PayPal popup/redirect opens for visitor.
   Visitor approves payment.
   │
6. Frontend calls POST /api/donations/capture-order
   │ Payload: { donationId: "MNM-DON-a8f3b2c1", orderId: "ORDER-98765" }
   │
7. Backend calls PayPal REST API v2:
   POST /v2/checkout/orders/ORDER-98765/capture
   PayPal captures payment, returns Capture ID "CAPTURE-54321" and COMPLETED status.
   Backend updates donation:
   - status = "COMPLETED"
   - paypalCaptureId = "CAPTURE-54321"
   - completedAt = current timestamp
   │
8. Frontend redirects visitor to /donate/success with donation ID and receipt details.
```

---

## 6. Webhooks & Idempotency

Webhooks handle asynchronous confirmation and edge cases (e.g. user closes browser immediately after approving PayPal):

1. **Endpoint**: `POST /api/paypal/webhook`
2. **Signature Verification**: Validates `paypal-transmission-id`, `paypal-transmission-time`, `paypal-transmission-sig`, `paypal-cert-url`, and `paypal-auth-algo` against PayPal's verification endpoint (`/v1/notifications/verify-webhook-signature`).
3. **Idempotency**:
   - When `PAYMENT.CAPTURE.COMPLETED` arrives: Checks if `paypalCustomId` or `paypalCaptureId` is already marked `COMPLETED`. If so, acknowledge with HTTP 200 without duplicate processing.
   - When `PAYMENT.CAPTURE.REFUNDED` arrives: Marks matching donation as `REFUNDED` and updates timestamp.
   - When `PAYMENT.CAPTURE.DENIED` arrives: Marks matching donation as `FAILED`.

---

## 7. Security & Privacy

1. **Secret Isolation**: `PAYPAL_CLIENT_SECRET` lives strictly in backend environment variables. Never baked into static assets or client code.
2. **Anti-Tampering**: Frontend cannot dictate `COMPLETED` status. Only PayPal capture response or cryptographically signed webhook can transition a donation to `COMPLETED`.
3. **Rate Limiting**: Protects order creation and admin routes from brute force / spam.
4. **CORS**: Configured to permit requests exclusively from `https://mosquenearme.net` (and `http://localhost:3000` in dev).
5. **Donor Privacy**:
   - If `isAnonymous` is selected, donor identity is never displayed publicly or in export reports unless required for audit.
   - No unnecessary personal data is requested or stored.

---

## 8. Deployment Strategy

### 8.1 Static Frontend (Unchanged)
* Built with `npm run build` producing static output in `out/`.
* Deployed to Hostinger `public_html/` via FileZilla / FTP / Zip as done currently.

### 8.2 External Backend
* Can be deployed in 2 minutes on:
  * **Render.com** (Free / low-cost Node.js web service)
  * **Railway.app**
  * **Fly.io**
  * **Hostinger VPS / Node.js app**
* Environment Variables to set in host dashboard:
  ```env
  PORT=4000
  NODE_ENV=production
  PAYPAL_MODE=sandbox          # Switch to 'live' when ready
  PAYPAL_CLIENT_ID=...
  PAYPAL_CLIENT_SECRET=...
  PAYPAL_WEBHOOK_ID=...
  ADMIN_API_KEY=...
  CORS_ORIGIN=https://mosquenearme.net
  ```

---

## 9. Moving from Sandbox to Live

1. Log into [PayPal Developer Dashboard](https://developer.paypal.com/).
2. Create Live REST API App under MosqueNearMe Business Account.
3. In the backend hosting dashboard, update:
   - `PAYPAL_MODE=live`
   - `PAYPAL_CLIENT_ID=<Live Client ID>`
   - `PAYPAL_CLIENT_SECRET=<Live Secret>`
   - `PAYPAL_WEBHOOK_ID=<Live Webhook ID>`
4. In the frontend environment config:
   - `NEXT_PUBLIC_PAYPAL_CLIENT_ID=<Live Client ID>`
5. Rebuild static site (`npm run build`) and upload `out/` to Hostinger.
