# Business Management System — Backend

A multi-tenant REST API for managing businesses, clients, products, and invoices. Built as a portfolio project to demonstrate production-grade backend architecture with Node.js, TypeScript, and MongoDB.

**Live repo**: [github.com/NHeroOP/Business-Management-System-Backend](https://github.com/NHeroOP/Business-Management-System-Backend)

---

## What This Project Demonstrates

- **Multi-tenancy** — users can own or belong to multiple businesses; all resources are scoped per business via a request header
- **JWT authentication** — short-lived access tokens + long-lived refresh tokens in HTTP-only cookies
- **Google OAuth 2.0** — account creation and linking via Passport.js
- **Role-based access control** — three-tier role system (OWNER / ADMIN / EMPLOYEE) enforced at the middleware layer
- **File uploads** — Multer → Cloudinary pipeline with guaranteed temp file cleanup
- **Transactional operations** — atomic invoice number generation using MongoDB sessions and `$inc + upsert`
- **Aggregate pagination** — MongoDB aggregation pipelines with `mongoose-aggregate-paginate-v2`
- **Layered architecture** — strict route → controller → service → model separation throughout

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js (ESM) |
| Language | TypeScript (strict) |
| Framework | Express 5 |
| Database | MongoDB + Mongoose 9 |
| Auth | JWT + Passport.js (Google OAuth) |
| File Storage | Cloudinary |
| Email | Resend |
| PDF Templating | Handlebars *(wiring in progress)* |
| Build | tsc + tsc-alias |
| Dev | tsx watch |

---

## Architecture

The codebase follows a strict 4-layer module pattern:

```
*.route.ts  →  *.controller.ts  →  *.service.ts  →  *.model.ts
```

Every protected, business-scoped request passes through:

```
verifyJWT → resolveWorkspace → requireRole(roles) → controller
```

- `verifyJWT` — validates JWT from cookie or `Authorization: Bearer` header; sets `req.user`
- `resolveWorkspace` — reads `x-business-id` header, validates `BusinessMember` record; sets `req.workspace`
- `requireRole` — checks `req.workspace.role` against allowed roles

### Multi-Tenancy

Every resource (client, product, invoice) carries a `businessId` field. The active business is selected per-request via the `x-business-id` HTTP header. A user can belong to multiple businesses with different roles in each.

### File Upload Pipeline

```
Client (multipart) → Multer (public/temp/) → Cloudinary → DB (url + publicId)
```

Temp files are always deleted after upload, whether it succeeds or fails.

### Invoice Number Generation

Invoice numbers follow the format `INV-{YEAR}-{SEQUENCE:0000}` (e.g. `INV-2025-0001`). The sequence is per-business per-year and incremented atomically using a MongoDB session — guaranteeing uniqueness even under concurrent requests.

---

## Project Structure

```
src/
├── index.ts                  # Entry point
├── app.ts                    # Express app, middleware, route mounting
├── consts.ts                 # Shared enums (Business_Roles, Product_Type, InvoiceStatus)
├── modules/
│   ├── auth/                 # JWT auth, Google OAuth, password reset
│   ├── user/                 # User model & profile
│   ├── business/             # Business CRUD + logo upload
│   ├── business-member/      # Membership management
│   ├── client/               # Client management
│   ├── product/              # Product catalog
│   ├── invoice/              # Invoicing (partially complete)
│   ├── invoiceCounter/       # Atomic invoice number sequencing
│   └── payment/              # Payments (model complete)
└── shared/
    ├── config/               # DB, Cloudinary, Passport, Resend
    ├── middlewares/          # verifyJWT, resolveWorkspace, requireRole, multer
    ├── utils/                # ApiError, ApiResponse, asyncHandler
    └── @types/               # Express Request type augmentation
```

---

## API Overview

All endpoints are prefixed with `/api/v1`. All responses use a consistent envelope:

```json
{
  "statusCode": 200,
  "data": {},
  "message": "Success",
  "success": true
}
```

### Authentication — `/auth`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/register` | — | Register with avatar upload |
| POST | `/auth/login` | — | Login; sets JWT cookies |
| POST | `/auth/logout` | JWT | Clears JWT cookies |
| GET | `/auth/me` | JWT | Current user profile |
| POST | `/auth/forgot-password` | — | Send password reset email |
| POST | `/auth/reset-password` | — | Reset password with token |
| GET | `/auth/google` | — | Google OAuth redirect |
| GET | `/auth/google/callback` | — | Google OAuth callback |

### Businesses — `/businesses`

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| POST | `/businesses` | JWT | Create business (auto-creates OWNER membership) |
| GET | `/businesses/:id` | JWT | Get business details |
| PATCH | `/businesses/:id` | OWNER | Update business info |
| PATCH | `/businesses/:id/logo` | OWNER | Update logo |

### Business Members — `/business-members`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/business-members` | List members |
| POST | `/business-members` | Add member |
| PATCH | `/business-members/:memberId/role` | Change role |
| DELETE | `/business-members/:memberId` | Remove member (soft delete) |

### Clients — `/clients`

| Method | Endpoint | Query Params | Description |
|--------|----------|-------------|-------------|
| GET | `/clients` | `page, limit, search` | Paginated list |
| POST | `/clients` | — | Create client |
| GET | `/clients/:id` | — | Get client |
| PATCH | `/clients/:id` | — | Update client |
| DELETE | `/clients/:id` | — | Archive client |

### Products — `/products`

Requires `x-business-id` header.

| Method | Endpoint | Query Params | Description |
|--------|----------|-------------|-------------|
| GET | `/products` | `page, limit, search, sortBy` | Paginated list |
| POST | `/products` | — | Create product with image upload |
| GET | `/products/:id` | — | Get product |
| PATCH | `/products/:id` | — | Update product |
| DELETE | `/products/:id` | — | Archive product |

### Invoices — `/invoices`

Requires `x-business-id` header.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/invoices` | Paginated list with client search |
| POST | `/invoices` | Create invoice (atomic number generation) |
| GET | `/invoices/:id` | Get invoice with populated client |
| PATCH | `/invoices/:id` | Update invoice *(in progress)* |
| DELETE | `/invoices/:id` | Archive invoice |
| PATCH | `/invoices/:id/status` | Change status (`DRAFT → SENT → PAID / OVERDUE / CANCELLED`) |
| GET | `/invoices/:id/pdf` | Download PDF *(in progress)* |

---

## Data Models

```
User ──< BusinessMember >── Business
                               │
               ┌───────────────┼───────────────┐
               │               │               │
            Client          Product         Invoice ──< Payment
```

All models use soft deletes (`isArchived: true`) — no hard deletes anywhere.

---

## Getting Started

### Prerequisites

- Node.js 18+ or Bun
- MongoDB (replica set required for invoice transactions — use Atlas free tier or a local replica set)
- Cloudinary account
- Google OAuth credentials *(optional)*
- Resend account *(optional, for password reset emails)*

### Setup

```bash
git clone https://github.com/NHeroOP/Business-Management-System-Backend.git
cd Business-Management-System-Backend
bun install        # or: bun install
cp .env.example .env
# fill in .env values (see below)
bun run dev        # or: bun run dev
```

Server starts on `http://localhost:3000`.

### Environment Variables

```env
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/business-management
CORS_ORIGIN=http://localhost:5173

ACCESS_TOKEN_SECRET=your_secret
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_SECRET=your_secret
REFRESH_TOKEN_EXPIRY=7d

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Optional
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/v1/auth/google/callback
BASE_URL=https://your-production-domain.com
```n

### Build for Production

```bash
bun run build   # tsc + tsc-alias → dist/
bun run start   # node dist/index.js
```

---

## Module Status

| Module | Status |
|--------|--------|
| auth | ✅ Complete |
| user routes | ✅ Complete|
| business | ✅ Complete |
| business-member | ✅ Complete |
| client | ✅ Complete |
| product | ✅ Complete |
| invoice | 🔧 Partially complete — create/list/archive/status-change work; update and PDF in progress |
| payment | 🔧 Model complete — service/routes in progress |

