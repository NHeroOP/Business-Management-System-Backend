# Business Management System — Backend

> A production-grade multi-tenant REST API for managing businesses, clients, products, invoices, and payments. Built to demonstrate real-world backend engineering: layered architecture, JWT + OAuth authentication, role-based access control, MongoDB transactions, and aggregate pagination.

**Live Repo**: [github.com/NHeroOP/Business-Management-System-Backend](https://github.com/NHeroOP/Business-Management-System-Backend)

---

## Table of Contents

1. [Overview](#overview)
2. [Problem Statement](#problem-statement)
3. [Features](#features)
4. [Architecture](#architecture)
5. [Tech Stack](#tech-stack)
6. [Database Design](#database-design)
7. [Authentication & Authorization](#authentication--authorization)
8. [Multi-Tenancy & RBAC](#multi-tenancy--rbac)
9. [Invoice System](#invoice-system)
10. [Payment System](#payment-system)
11. [Security](#security)
12. [API Highlights](#api-highlights)
13. [Notable Engineering Decisions](#notable-engineering-decisions)
14. [Folder Structure](#folder-structure)
15. [Getting Started](#getting-started)
16. [Environment Variables](#environment-variables)
17. [Future Improvements](#future-improvements)
18. [Why This Project Matters](#why-this-project-matters)
19. [Resume Highlights](#resume-highlights)

---

## Overview

This is a backend API for a multi-tenant business management platform — the kind of system that powers tools like FreshBooks, Wave, or Zoho Invoice. A single deployment serves multiple independent businesses. Each business has its own members, clients, products, invoices, and payments, with no data leakage between tenants.

The project is built as a portfolio piece to demonstrate production-grade backend engineering patterns in Node.js, TypeScript, and MongoDB.

---

## Problem Statement

Small businesses need a unified system to manage their clients, catalog their products or services, generate invoices, and track payments — all scoped to their own workspace, with different team members having different levels of access.

This API solves:
- **Multi-tenancy**: one API serves many businesses with strict data isolation
- **Team access control**: owners, admins, and employees have different permissions
- **Invoicing**: atomic invoice number generation, line-item price snapshots, status lifecycle
- **Payments**: transactional payment recording that automatically marks invoices as paid
- **Identity**: local credentials and Google OAuth, with secure token management

---

## Features

### Authentication
- Register with avatar upload (Multer → Cloudinary)
- Login with email/username + password; JWT issued as HTTP-only cookies
- Google OAuth 2.0 via Passport.js (account creation and linking)
- Short-lived access tokens (15m) + long-lived refresh tokens (7d)
- Secure password reset: SHA-256 hashed token, 10-minute expiry, email via Resend
- Token stored in HTTP-only cookies; also accepts `Authorization: Bearer` header

### User Profile
- Get and update profile
- Change password (current password verified before update)
- Update avatar (Cloudinary upload with temp file cleanup)

### Workspace Management
- Create a business (auto-assigns creator as OWNER)
- Update business details and logo
- Per-request workspace selection via `x-business-id` header
- A user can belong to multiple businesses with different roles in each

### Role-Based Access Control
- Three-tier role system: `OWNER` → `ADMIN` → `EMPLOYEE`
- Role enforced at middleware layer before controllers execute
- `permissions[]` array on membership record for future fine-grained control

### Business Members
- Invite members by user ID
- Change member roles
- Soft-remove members (re-activatable)
- List all members in a workspace

### Clients
- Full CRUD with soft delete
- Paginated list with full-text search on name
- GST number and company name fields for B2B use cases

### Products
- Full CRUD with soft delete and image upload
- Supports both physical `PRODUCT` and `SERVICE` types
- SKU with sparse unique index
- Paginated list with text search and configurable sort

### Invoices
- Atomic invoice number generation (`INV-YYYY-NNNN`) using MongoDB transactions
- Line items with price snapshots (price at time of invoice, not current product price)
- Tax and discount as percentages; totals calculated server-side
- Full status lifecycle: `DRAFT → SENT → PAID / OVERDUE / CANCELLED`
- Email notification to client on status change to `SENT`
- PDF generation via Puppeteer + Handlebars
- Paginated list with client name/email search via aggregation pipeline

### Payments
- Record payments against invoices
- Supported methods: `CASH`, `UPI`, `BANK`, `CARD`
- Atomic transaction: if payment amount ≥ invoice total, invoice status is set to `PAID` in the same session
- Paginated list with filters: invoice, status, method, date range

### File Uploads
- Multer disk storage → Cloudinary upload pipeline
- Temp files always deleted after upload (success or failure)
- Used for: user avatars, business logos, product images

---

## Architecture

The project follows a strict 4-layer modular architecture. Every domain module is self-contained and follows the same file pattern.

```
Request → Router → Controller → Service → Model → MongoDB
```

### Module Pattern

Each of the 8 domain modules contains exactly:

| File | Responsibility |
|------|---------------|
| `*.model.ts` | Mongoose schema, interface, indexes, plugins |
| `*.service.ts` | All business logic; database queries; external service calls |
| `*.controller.ts` | Parse request, call service, send response |
| `*.route.ts` | Route definitions, middleware chain |

### Middleware Chain

Every protected business-scoped route passes through three middleware layers before reaching the controller:

```
verifyJWT → resolveWorkspace → requireRole(roles) → controller
```

- **`verifyJWT`** — validates the JWT from cookie or `Authorization` header; attaches `req.user`
- **`resolveWorkspace`** — reads the `x-business-id` header; validates the user's `BusinessMember` record; attaches `req.workspace` with the user's role
- **`requireRole`** — checks `req.workspace.role` against the allowed roles for the route

### Multi-Tenancy Model

Every resource document carries a `businessId` field. The active business is selected per-request via the `x-business-id` HTTP header. A single user can belong to multiple businesses with different roles in each — membership is modeled as a separate `BusinessMember` join entity, not embedded on the user.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 18+ |
| Language | TypeScript (strict, ESM) |
| Framework | Express 5 |
| Database | MongoDB + Mongoose 9 |
| Authentication | JWT (jsonwebtoken), Passport.js |
| OAuth | Google OAuth 2.0 (passport-google-oauth20) |
| Password Hashing | bcrypt |
| File Storage | Cloudinary (via Multer disk → upload pipeline) |
| Email | Resend |
| PDF Generation | Puppeteer + Handlebars |
| Pagination | mongoose-aggregate-paginate-v2 |
| Slug Generation | slugify |
| Dev Server | tsx (watch mode) |
| Build | tsc + tsc-alias (path alias resolution) |

---

## Database Design

### Entity Relationships

```
User ──< BusinessMember >── Business
                               │
              ┌────────────────┼────────────────┐
              │                │                │
           Client           Product          Invoice ──< InvoiceItem
              │                                  │
              └──────────────────────────────> Payment
```

### Key Design Decisions

**`BusinessMember` as a join entity** — Rather than embedding role on `User` or `Business`, membership is a first-class document. This allows a user to have different roles in different businesses and makes membership auditable.

**`InvoiceCounter` as a sequence document** — A dedicated collection with a compound unique index on `{ businessId, year }` enables atomic, gap-free invoice number generation using `findOneAndUpdate + $inc + upsert` inside a MongoDB session.

**Price snapshots on invoice items** — Each `IInvoiceItem` stores `name`, `price`, and `total` at the time of invoice creation. If a product's price changes later, historical invoices remain accurate.

**Soft deletes everywhere** — All models use `isArchived: boolean`. No hard deletes. Archived records can be restored and provide a full audit trail.

### Collections & Indexes

| Collection | Notable Indexes |
|-----------|----------------|
| `users` | unique on `username`, `email` |
| `businesses` | unique on `slug` |
| `businessmembers` | indexed on `businessId`, `memberId` |
| `clients` | text index on `name`; indexed on `businessId` |
| `products` | text index on `name`; sparse unique on `sku` |
| `invoices` | unique on `invoiceNumber`; indexed on `businessId`, `client`, `status` |
| `invoicecounters` | unique compound on `{ businessId, year }` |
| `payments` | compound indexes on `{ businessId, paidAt }`, `{ businessId, invoiceId }`, `{ businessId, status }` |

---

## Authentication & Authorization

### Token Strategy

Access tokens are short-lived (15 minutes) and refresh tokens are long-lived (7 days). Both are issued as HTTP-only cookies to prevent JavaScript access. The API also accepts `Authorization: Bearer <token>` for non-browser clients.

```
POST /api/v1/auth/login
→ Set-Cookie: accessToken (httpOnly, 15m)
→ Set-Cookie: refreshToken (httpOnly, 7d)
```

### Password Reset Flow

1. `POST /auth/forgot-password` — generates a `crypto.randomBytes(32)` token, stores its SHA-256 hash on the user with a 10-minute expiry, sends the raw token in a reset link via Resend
2. `POST /auth/reset-password` — hashes the incoming token, finds the user by ID + hash, verifies expiry, updates password

### Google OAuth

Passport.js `GoogleStrategy` handles the OAuth handshake. On callback, the strategy finds or creates a user by `googleId` or email, then issues the same JWT cookies as a local login.

---

## Multi-Tenancy & RBAC

### Workspace Selection

Every business-scoped request must include an `x-business-id` header. The `resolveWorkspace` middleware:

1. Reads `x-business-id`
2. Queries `BusinessMember` for `{ businessId, memberId: req.user._id, isArchived: false }`
3. Attaches `req.workspace = { businessId, role, memberId }` if found; throws 403 otherwise

This means a user with accounts in two businesses can switch context per-request without re-authenticating.

### Role Hierarchy

```
OWNER > ADMIN > EMPLOYEE
```

| Operation | OWNER | ADMIN | EMPLOYEE |
|-----------|-------|-------|----------|
| Manage members | ✅ | ✅ | ❌ |
| Change member roles | ✅ | ✅ | ❌ |
| Update business settings | ✅ | ❌ | ❌ |
| Create/update clients | ✅ | ✅ | ✅ |
| Create/update invoices | ✅ | ✅ | ✅ |
| Record payments | ✅ | ✅ | ✅ |

---

## Invoice System

### Atomic Invoice Number Generation

Invoice numbers follow the format `INV-{YEAR}-{SEQUENCE:0000}` (e.g. `INV-2025-0042`). The sequence is per-business per-year and is generated atomically:

```
startSession()
  → InvoiceCounter.findOneAndUpdate({ businessId, year }, { $inc: { sequence: 1 } }, { upsert: true })
  → Invoice.create([{ invoiceNumber, ...data }], { session })
commitTransaction()
```

This guarantees no duplicate invoice numbers even under concurrent requests, and requires a MongoDB replica set.

### Price Snapshots

When an invoice is created, each line item captures `name`, `price`, and `total` from the product at that moment. Future product price changes do not affect existing invoices — a critical correctness requirement for any real invoicing system.

### Status Lifecycle

```
DRAFT → SENT → PAID
             → OVERDUE
             → CANCELLED
```

Transitioning to `SENT` triggers an email notification to the client via Resend.

### PDF Generation

`GET /api/v1/invoices/:id/pdf` renders the invoice using a Handlebars template compiled server-side, then passes the HTML to Puppeteer (headless Chromium) to produce a PDF buffer returned as `application/pdf`.

---

## Payment System

Payments are recorded against invoices with a method (`CASH`, `UPI`, `BANK`, `CARD`) and status (`SUCCESS`, `PENDING`, `FAILED`).

### Atomic Invoice Closure

When a payment is created with `status: SUCCESS` and `amount >= invoice.total`, the invoice status is updated to `PAID` in the same MongoDB session:

```
startSession()
  → Invoice.findOne({ _id: invoiceId }) — check total
  → invoice.status = 'PAID'; invoice.save({ session })
  → Payment.create([{ ... }], { session })
commitTransaction()
```

This prevents a payment from being recorded without the invoice being marked paid, and vice versa.

---

## Security

| Mechanism | Implementation |
|-----------|---------------|
| Password hashing | bcrypt (10 rounds), pre-save hook on User model |
| Token storage | HTTP-only cookies; not accessible to JavaScript |
| Password reset tokens | SHA-256 hashed before storage; 10-minute expiry |
| CORS | Configured with explicit `CORS_ORIGIN` env var |
| Workspace isolation | Every query scoped to `businessId`; membership validated per request |
| Soft deletes | No hard deletes; archived records excluded from all queries |
| File upload | Temp files always deleted after Cloudinary upload (success or failure) |

---

## API Highlights

### Paginated Invoice List with Client Search

```
GET /api/v1/invoices?page=1&limit=10&name=acme&email=billing@acme.com
```

Uses a MongoDB aggregation pipeline: `$match` on `businessId` → `$lookup` clients → `$addFields` to unwrap → `$match` on joined client fields → `$sort` → `aggregatePaginate`.

### Atomic Invoice Creation

```
POST /api/v1/invoices
{
  "clientId": "...",
  "items": [{ "productId": "...", "quantity": 2 }],
  "tax": 18,
  "discount": 5,
  "dueDate": "2025-12-31"
}
```

Server resolves product prices, calculates subtotal/tax/discount/total, generates invoice number atomically, and creates the invoice — all in a single transaction.

### Payment with Auto-Close

```
POST /api/v1/payments
{
  "invoiceId": "...",
  "amount": 5000,
  "method": "UPI"
}
```

If `amount >= invoice.total`, the invoice is atomically marked `PAID` in the same session.

### Workspace-Scoped Requests

All business-scoped endpoints require:
```
x-business-id: <businessId>
Authorization: Bearer <accessToken>   (or cookie)
```

---

## Notable Engineering Decisions

### 1. `BusinessMember` as a First-Class Join Entity
Role is not embedded on `User` or `Business`. A separate `BusinessMember` document links the two, carrying `role` and `permissions`. This enables a single user to hold different roles across different businesses and makes membership history auditable.

### 2. `InvoiceCounter` for Gap-Free Sequence Numbers
Rather than querying `MAX(invoiceNumber)` — which races under concurrency — a dedicated `InvoiceCounter` collection uses `findOneAndUpdate + $inc + upsert` inside a MongoDB session. The compound unique index `{ businessId, year }` guarantees per-business, per-year sequences with no gaps and no duplicates.

### 3. Price Snapshots on Invoice Line Items
Each `IInvoiceItem` stores `name`, `price`, and `total` at creation time. This is a deliberate denormalization: if a product's price is updated later, all historical invoices remain financially accurate. Storing only a `productId` reference would silently corrupt historical records.

### 4. Atomic Payment + Invoice Closure
Recording a payment and marking an invoice as `PAID` happen in a single MongoDB session. If either operation fails, both are rolled back. This prevents the split-brain state where a payment exists but the invoice still shows as unpaid.

### 5. Header-Based Workspace Context
The active business is selected via `x-business-id` header rather than a URL prefix (e.g. `/businesses/:id/invoices`). This keeps route paths flat and allows a single authenticated session to switch business context per-request — useful for multi-tab browser clients or admin tooling.

### 6. Aggregate Pagination with Post-Join Filtering
The invoice list endpoint joins client data via `$lookup`, then applies a second `$match` on the joined fields for client name/email search. This is the correct approach for cross-collection search in MongoDB — a naive approach would require fetching all invoices and filtering in application code.

### 7. Soft Deletes as a Universal Pattern
Every model uses `isArchived: boolean` instead of hard deletes. This provides a full audit trail, enables record restoration, and prevents accidental data loss. All queries filter `{ isArchived: false }` by default.

### 8. Layered Service Architecture
Controllers are intentionally thin — they parse the request and call a service. All business logic, validation, and database access lives in the service layer. This makes services independently testable and keeps controllers free of domain logic.

---

## Folder Structure

```
src/
├── index.ts                        # Entry point: load env → connect DB → start server
├── app.ts                          # Express app: middleware, route mounting
├── consts.ts                       # Shared enums: BUSINESS_ROLE, INVOICE_STATUS, etc.
│
├── modules/
│   ├── auth/
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── auth.route.ts
│   │   ├── auth.util.ts            # generateTokens, hashData
│   │   └── auth.const.ts
│   ├── user/
│   │   ├── User.model.ts
│   │   ├── user.controller.ts
│   │   ├── user.service.ts
│   │   └── user.route.ts
│   ├── business/
│   │   ├── Business.model.ts
│   │   ├── business.controller.ts
│   │   ├── business.service.ts
│   │   ├── business.route.ts
│   │   └── business.util.ts
│   ├── business-member/
│   │   ├── BusinessMember.model.ts
│   │   ├── businessMember.controller.ts
│   │   ├── businessMember.service.ts
│   │   └── businessMember.route.ts
│   ├── client/
│   │   ├── Client.model.ts
│   │   ├── client.controller.ts
│   │   ├── client.service.ts
│   │   └── client.route.ts
│   ├── product/
│   │   ├── Product.model.ts
│   │   ├── product.controller.ts
│   │   ├── product.service.ts
│   │   └── product.route.ts
│   ├── invoice/
│   │   ├── Invoice.model.ts
│   │   ├── invoice.controller.ts
│   │   ├── invoice.service.ts
│   │   ├── invoice.route.ts
│   │   └── templates/invoice.hbs   # Handlebars PDF template
│   ├── invoiceCounter/
│   │   └── InvoiceCounter.model.ts
│   └── payment/
│       ├── Payment.model.ts
│       ├── payment.controller.ts
│       ├── payment.service.ts
│       └── payment.route.ts
│
└── shared/
    ├── config/
    │   ├── connectDB.ts
    │   ├── cloudinary.ts
    │   ├── passport.ts
    │   └── resend.ts
    ├── middlewares/
    │   ├── auth.middleware.ts       # verifyJWT
    │   ├── workspace.middleware.ts  # resolveWorkspace
    │   ├── rbac.middleware.ts       # requireRole
    │   └── multer.middleware.ts
    ├── utils/
    │   ├── ApiError.ts
    │   ├── ApiResponse.ts
    │   ├── asyncHandler.ts
    │   └── usernameGen.ts
    └── @types/
        └── express/index.d.ts      # req.user, req.workspace augmentation
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB with replica set enabled (required for transactions — Atlas free tier works)
- Cloudinary account
- Resend account (for emails)
- Google OAuth credentials (optional)

### Installation

```bash
git clone https://github.com/NHeroOP/Business-Management-System-Backend.git
cd Business-Management-System-Backend
npm install
```

### Development

```bash
cp .env.example .env
# Fill in your environment variables
npm run dev
```

### Production Build

```bash
npm run build
npm start
```

---

## Environment Variables

| Variable | Required | Description |
|----------|---------|-------------|
| `PORT` | No | Server port (default: 3000) |
| `NODE_ENV` | No | `development` or `production` |
| `MONGODB_URI` | Yes | MongoDB connection string (must be a replica set) |
| `CORS_ORIGIN` | Yes | Allowed CORS origin |
| `ACCESS_TOKEN_SECRET` | Yes | JWT signing secret for access tokens |
| `ACCESS_TOKEN_EXPIRY` | Yes | Access token TTL (e.g. `15m`) |
| `REFRESH_TOKEN_SECRET` | Yes | JWT signing secret for refresh tokens |
| `REFRESH_TOKEN_EXPIRY` | Yes | Refresh token TTL (e.g. `7d`) |
| `CLOUDINARY_CLOUD_NAME` | Yes | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Yes | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Yes | Cloudinary API secret |
| `GOOGLE_CLIENT_ID` | Optional | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Optional | Google OAuth client secret |
| `GOOGLE_CALLBACK_URL` | Optional | OAuth callback URL |
| `BASE_URL` | Optional | Production domain for password reset links |

---

## Future Improvements

- **Integration tests** — Vitest + Supertest covering auth, invoice creation, and workspace resolution
- **Request validation** — Zod schemas on all incoming request bodies
- **Global error handler** — Structured error middleware in `app.ts`
- **Docker + docker-compose** — One-command local setup including MongoDB replica set
- **OpenAPI/Swagger** — Auto-generated API documentation
- **Structured logging** — Pino with request ID propagation; replace all `console.log`
- **Rate limiting** — `express-rate-limit` on auth routes; per-workspace quotas
- **Security headers** — `helmet.js` for CSP, HSTS, and other HTTP security headers
- **Background jobs** — BullMQ + Redis for async email delivery and PDF generation
- **Analytics endpoints** — Revenue by period, invoice aging, top clients via aggregation pipelines
- **Refresh token rotation** — Issue a new refresh token on every use; invalidate the old one
- **Webhook support** — Notify external systems on invoice status changes and payment events

---

## Why This Project Matters

This project was built to demonstrate the engineering concepts that separate mid-level from senior backend engineers. It is not a tutorial CRUD app — it solves real architectural problems that appear in production SaaS systems.

**For recruiters and hiring managers:**

The concepts implemented here — multi-tenancy, RBAC, atomic transactions, OAuth, aggregate pipelines — are exactly what backend engineering job descriptions ask for at the mid-to-senior level. Each one required deliberate design decisions, not just following a tutorial.

**What this project demonstrates:**

- **System design thinking**: The `BusinessMember` join entity, `InvoiceCounter` sequence document, and header-based workspace selection are all deliberate architectural choices with real tradeoffs.
- **Database expertise**: MongoDB transactions, compound indexes, sparse unique indexes, and aggregation pipelines with post-join filtering are non-trivial skills.
- **Security awareness**: HTTP-only cookies, hashed reset tokens with expiry, bcrypt password hashing, and workspace-scoped query isolation are production security patterns.
- **Domain modeling**: Price snapshotting on invoice items, atomic payment + invoice closure, and soft deletes as a universal pattern reflect understanding of real business requirements.
- **TypeScript discipline**: Strict mode, typed service interfaces, and Express request augmentation via declaration merging demonstrate TypeScript beyond basic usage.

---

## Resume Highlights

- Architected a multi-tenant REST API in Node.js/TypeScript serving multiple isolated business workspaces from a single deployment, with per-request workspace resolution via custom Express middleware
- Implemented role-based access control (OWNER/ADMIN/EMPLOYEE) enforced at the middleware layer using a composable `requireRole` guard and a `BusinessMember` join entity that decouples identity from workspace membership
- Designed atomic invoice number generation using MongoDB transactions and a dedicated `InvoiceCounter` sequence collection with a compound unique index, guaranteeing gap-free sequences under concurrent requests
- Built a transactional payment system that atomically records payments and marks invoices as `PAID` within a single MongoDB session, preventing split-brain state between payment and invoice records
- Implemented JWT authentication with HTTP-only cookie storage, Google OAuth 2.0 via Passport.js, and a secure password reset flow using SHA-256 hashed tokens with 10-minute expiry
- Engineered invoice line-item price snapshotting to preserve financial accuracy when product prices change after invoice creation — a deliberate denormalization for correctness
- Built paginated invoice search using MongoDB aggregation pipelines with `$lookup` + post-join `$match` for cross-collection client name/email filtering
- Designed a Multer → Cloudinary file upload pipeline with guaranteed temp file cleanup on both success and failure paths, used for user avatars, business logos, and product images
- Modeled 8 domain entities with appropriate indexes (text, compound, sparse unique) and soft delete patterns across all collections for full audit trail support
- Applied TypeScript strict mode with custom Express request augmentation (`req.user`, `req.workspace`) via declaration merging for end-to-end type safety across the middleware chain
