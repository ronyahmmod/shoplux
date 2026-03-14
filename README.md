# ShopLux — Next.js E-Commerce Platform

A production-ready e-commerce platform with a separate storefront and admin dashboard, built with Next.js 14 (JS), NextAuth.js, MongoDB, and Cloudinary.

---

## Project Structure

```
ecommerce/
├── apps/
│   ├── storefront/          # Customer-facing site (port 3000)
│   └── admin/               # Admin dashboard (port 3001)
└── packages/
    └── lib/
        ├── models/          # Shared Mongoose models
        ├── middleware/       # Auth guards, error handlers
        ├── utils/            # DB connection, Cloudinary
        └── validators/       # Zod schemas
```

---

## Quick Start

Follow these steps **in order**. Each step depends on the previous one.

---

### Step 1 — Install dependencies

> ⚠️ Do this **before** anything else. The seed script and both apps need these packages.

```bash
npm install
```

This installs packages for all workspaces: `apps/storefront`, `apps/admin`, `packages/lib`, and `scripts`.

---

### Step 2 — Configure environment variables

Copy the example files:
```bash
cp apps/storefront/.env.local.example apps/storefront/.env.local
cp apps/admin/.env.local.example       apps/admin/.env.local
```

Then open each file and fill in your credentials:

| Variable | Where to get it |
|---|---|
| `MONGODB_URI` | [MongoDB Atlas](https://cloud.mongodb.com) → Connect → Drivers |
| `NEXTAUTH_SECRET` | Run: `openssl rand -base64 32` |
| `CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET` | [Cloudinary Console](https://console.cloudinary.com) |
| `STRIPE_SECRET_KEY` | [Stripe Dashboard](https://dashboard.stripe.com/apikeys) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Same page as above |
| `GOOGLE_CLIENT_ID/SECRET` | [Google Cloud Console](https://console.cloud.google.com) → APIs → Credentials *(optional)* |

> ℹ️ `MONGODB_URI` must be filled in before Step 3.

---

### Step 3 — Seed the first admin user

> ⚠️ Requires Step 1 (packages) and Step 2 (MONGODB_URI) to be done first.

```bash
npm run seed
```

This reads `MONGODB_URI` from `apps/admin/.env.local` automatically. It creates:

```
Email    : admin@yourshop.com
Password : Admin@123456
```

**Change this password immediately after your first login.**

If the admin already exists, the script will say so and exit safely — it won't create duplicates.

---

### Step 4 — Run both apps

Open two terminals:

```bash
# Terminal 1 — Storefront (http://localhost:3000)
npm run dev:storefront

# Terminal 2 — Admin panel (http://localhost:3001)
npm run dev:admin
```

---

## Architecture

### Authentication
- **Storefront**: NextAuth with Google OAuth + Email/Password. Sessions stored as JWT.
- **Admin**: Credentials only. Middleware protects every route — non-admins are redirected to `/login`.
- Passwords hashed with bcrypt (12 rounds). Passwords never returned in API responses.

### Database (MongoDB Atlas)
| Collection | Purpose |
|---|---|
| `users` | Customers and admins (role field) |
| `products` | Product catalog with Cloudinary image refs |
| `orders` | Orders with status history timeline |
| `reviews` | Product reviews (1 per user per product) |
| `coupons` | Discount codes (percentage or fixed) |

**Security**: IP whitelist your Vercel deployment IPs in Atlas. Enable TLS (default). Never expose your `MONGODB_URI` publicly.

### Assets (Cloudinary)
- Admin uploads images via `/api/upload` (server-side, signed — API secret never reaches browser)
- Images stored as `{ public_id, secure_url }` in MongoDB
- On-the-fly transforms via Cloudinary URL: `w_400,c_fill,f_auto,q_auto`
- Deleting a product also deletes its Cloudinary images

### Social Media Integration
Each product page at `/products/[slug]` generates Open Graph meta tags automatically:
```js
// app/products/[slug]/page.js
export async function generateMetadata({ params }) { ... }
```
Share the product URL on Facebook/Instagram — it renders a rich preview card. Clicking navigates to your storefront.

### Payments (Stripe)
- Create a PaymentIntent on your server → return `client_secret` to frontend
- Stripe.js handles card input (PCI compliant — card data never touches your server)
- Stripe webhook at `/api/webhook/stripe` updates order status automatically

---

## Deployment

### Deploy to Vercel (recommended)

**Storefront:**
```bash
cd apps/storefront
vercel --prod
```

**Admin (separate project):**
```bash
cd apps/admin
vercel --prod
```

Set all env vars in Vercel dashboard → Settings → Environment Variables.

Update `NEXTAUTH_URL` to your production URLs:
- Storefront: `https://yourshop.com`
- Admin: `https://admin.yourshop.com`

### Stripe Webhook (production)
1. Vercel dashboard → your storefront project → copy production URL
2. Stripe Dashboard → Webhooks → Add endpoint: `https://yourshop.com/api/webhook/stripe`
3. Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded`
4. Copy the signing secret → add as `STRIPE_WEBHOOK_SECRET` in Vercel

---

## Adding Features

### New payment provider (bKash, SSLCommerz)
1. Add provider SDK to `apps/storefront/package.json`
2. Create `/api/payment/[provider]/route.js` for initiation
3. Create `/api/payment/[provider]/callback/route.js` for webhook/redirect handling
4. Update order `paymentStatus` and `paymentId` on success

### Email notifications
Use [Resend](https://resend.com) or [Nodemailer](https://nodemailer.com):
```js
// Call after order creation in /api/orders/route.js
await sendOrderConfirmationEmail(order, user);
```

### Categories management
Add a `Category` model and admin CRUD pages following the same pattern as Products.

---

## Security Checklist
- [ ] All env vars set (no `.env.local` committed to git)
- [ ] MongoDB Atlas IP whitelist configured
- [ ] Admin URL not publicly linked from storefront
- [ ] `NEXTAUTH_SECRET` is a random 32+ character string
- [ ] Cloudinary signed upload preset (no unsigned uploads)
- [ ] Rate limiting on auth routes (`/api/auth`)
- [ ] Stripe webhook signature verification enabled
- [ ] Changed default admin password from `Admin@123456`
