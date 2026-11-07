# VETRINA BOUTIQUE — فيترينا بوتيك

Arabic-first (RTL) women's fashion store for Palestine, with a full admin panel.
Free delivery across Palestine, cash on delivery, real database-backed orders and inventory.

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16.4 (App Router, Turbopack, Server Actions, `proxy.ts`), React 19, TypeScript strict |
| UI | Tailwind CSS v4 (design tokens in `src/app/globals.css`), shadcn-style primitives on Radix (`radix-ui`), `motion` for animation, lucide icons, Sonner toasts |
| Fonts | Tajawal (Arabic UI) + Playfair Display (Latin luxury headings) via `next/font` |
| Data | PostgreSQL 15+ · Prisma 7 (`prisma-client` generator + `@prisma/adapter-pg`) |
| Validation / forms | Zod 4 · React Hook Form |
| Auth | Own session auth: argon2id hashes, random session tokens stored only as SHA-256, httpOnly cookies, login rate limiting, role checks on every action |
| Images | `sharp` validation + re-encode to WebP (EXIF stripped). Storage driver: `local` (dev / single VPS) or any **S3-compatible** bucket (Cloudflare R2, AWS S3, B2…) |
| Tests | Vitest against a real PostgreSQL test database |

## Architecture

```
src/
  app/
    (store)/            customer storefront (RTL) — home, shop, category, collections, product,
                        cart, checkout, order/[reference] (secure tracking), track, wishlist,
                        size-guide, policies, account (optional customer accounts)
    admin/login         admin sign-in (rate-limited)
    admin/(panel)/      dashboard, orders (+ detail, manual order, CSV export), products (7-step editor),
                        inventory, categories & collections, size charts, delivery areas,
                        WhatsApp templates, site settings, activity log
    admin/print/[id]    printable packing slip
    api/admin/upload    authenticated same-origin image upload
    api/whatsapp/webhook  Meta Cloud API webhook (signature-verified; inactive unless configured)
    media/[...path]     serves locally stored uploads
    sitemap.ts robots.ts
  server/               domain logic (no Next.js imports → unit-testable)
    orders.ts           createOrder (transaction, conditional stock decrement, idempotency),
                        changeOrderStatus (state machine), restoreOrderStock (exactly-once)
    inventory.ts        atomic manual adjustments + movement log
    products.ts         save product aggregate (colours/images/variants, stock as deltas), duplicate
    catalog.ts cart.ts dashboard.ts admin-orders.ts whatsapp-cloud.ts
  lib/                  auth, sessions, rate limit, audit, settings (zod), money (agorot), phone (E.164),
                        sizes (size finder), variant-selection, whatsapp templates, storage
  components/store      storefront UI (hero motion, product gallery, filters, checkout…)
  components/admin      admin UI (shell, charts, product editor, order actions…)
prisma/                 schema, migrations, non-destructive seed
scripts/                db-local (dev Postgres), create-admin, demo-images, brand-assets
tests/                  checkout, stock concurrency, order status, admin auth, variants
```

### Key data rules
- **Money** is stored as integer *agorot* (`18900` = 189 ₪). Totals are always computed on the server from the database — prices sent by the browser are never trusted.
- **Every purchasable combination** (product × colour × size) is a `ProductVariant` with its own SKU, stock, optional price adjustment and active flag.
- **No overselling**: checkout decrements stock with `UPDATE … WHERE stock >= qty` inside one transaction, in a fixed lock order. Tested with concurrent checkouts.
- **Idempotent checkout**: each checkout form carries a UUID; retries and double-clicks return the same order.
- **Stock restoration** on cancellation happens exactly once (guarded by `Order.stockRestoredAt`). Returns restock only when the admin ticks the box.
- **Order status / payment status / fulfilment** (courier, tracking code) are separate fields. Status transitions follow `src/lib/order-status.ts`.
- **Ordered products are never hard-deleted** — they can only be archived; ordered variants are deactivated instead of removed. Order items keep a snapshot (name, colour, size, SKU, price).
- **Tracking links** use an unguessable per-order token; `/track` also allows lookup by reference + phone.

## Local development

Requirements: Node 20.19+ (tested on Node 24), npm.

```bash
npm install
cp .env.example .env          # already points at the local dev database below
npm run db:local              # starts a real local PostgreSQL on port 5433 (keep it running)
npx prisma migrate deploy     # create tables
npm run demo:images           # (optional) regenerate the labelled DEMO garment images
npm run db:seed               # reference data + clearly-labelled demo products (safe to re-run)
npm run admin:create -- --email you@example.com --name "Your Name"   # asks for a password
npm run dev                   # http://localhost:3000  ·  admin: /admin
```

`npm run db:local` uses the PostgreSQL binaries from the `embedded-postgres` package; data lives in
`%LOCALAPPDATA%/vetrina-pg` (or `~/vetrina-pg`). You can use any other PostgreSQL instead — just set `DATABASE_URL`.

Seed behaviour: it **never deletes or overwrites** existing data. Demo products are marked `isDemo`, show a
«منتج تجريبي» badge, are excluded from the sitemap and set to `noindex`. Skip them with `SEED_DEMO_PRODUCTS=false`.
Delete or archive them from **Admin → المنتجات** before launch.

### Quality gates

```bash
npm run typecheck   # next typegen + tsc --noEmit
npm run lint
npm test            # needs the local DB running; uses database "vetrina_test" from .env.test
npm run build
```

## Creating the first admin securely

```bash
npm run admin:create -- --email owner@vetrina.ps --name "Owner"
```
The password is prompted (hidden) and must be ≥ 12 characters; it is stored as an argon2id hash and never logged.
Use `--reset` to change the password of an existing account (all its sessions are revoked).
In CI you may pass `ADMIN_PASSWORD` as an environment variable for a single run — never commit it.
Admin login is rate-limited (5 failures per email / 10 per IP per 15 minutes) and every sensitive action is written to the audit log (**سجل النشاط**).
Roles: `ADMIN` (everything) and `STAFF` (orders, products, inventory — not site settings or permanent deletes).

## Deployment

Any Node.js host works (Vercel, Railway, Render, Fly.io, a VPS with PM2/Docker).

1. **Database** — create a managed PostgreSQL (Neon, Supabase, Railway, RDS…). Set `DATABASE_URL`.
2. **Images** — for serverless hosts (Vercel etc.) use `STORAGE_DRIVER=s3` (e.g. Cloudflare R2 + public bucket/custom domain):
   `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_PUBLIC_BASE_URL`.
   The `local` driver is only suitable for a single persistent server (files go to `./uploads`, or `STORAGE_LOCAL_DIR`).
3. **Site URL** — `NEXT_PUBLIC_SITE_URL=https://your-domain` (used for SEO, sitemap and WhatsApp tracking links).
4. Build & migrate:
   ```bash
   npm ci
   npx prisma migrate deploy
   npm run db:seed            # first deploy only (reference data); SEED_DEMO_PRODUCTS=false for a clean store
   npm run build && npm start
   ```
5. Create the admin (`npm run admin:create …`) from a machine that can reach the production database.
6. Put the site behind HTTPS (cookies are `Secure` in production).

## WhatsApp

- **Default (no credentials needed):** on each order the admin clicks **«فتح واتساب»**. This opens a `wa.me` draft with the
  customer's number and the editable Arabic template for the chosen status. The system records only that a *draft was opened* —
  it never claims a message was sent. Templates are editable in **Admin → قوالب واتساب**.
- **Automated (optional):** only via the official **WhatsApp Business Platform Cloud API** with the merchant's own credentials:
  `WHATSAPP_CLOUD_ACCESS_TOKEN`, `WHATSAPP_CLOUD_PHONE_NUMBER_ID`, `WHATSAPP_CLOUD_APP_SECRET`, `WHATSAPP_CLOUD_VERIFY_TOKEN`
  (+ optional `WHATSAPP_CLOUD_TEMPLATE_NAME`, `…_TEMPLATE_LANG`, `…_API_VERSION`). You must create and get approval for a
  message template (default name `order_status_update`, body parameters: name, reference, status) and point the webhook to
  `https://your-domain/api/whatsapp/webhook`. Messages are only sent to customers who ticked the consent box at checkout, and
  delivery status (sent / delivered / read / failed) is updated exclusively from signed Meta webhooks.

## Size guide

The default chart contains the **provisional** European values supplied with the brief. They are clearly marked as needing
merchant confirmation — review them in **Admin → دليل المقاسات**. Charts can be assigned per category or per product; values
are body measurements in cm unless the chart type is switched to garment measurements.
