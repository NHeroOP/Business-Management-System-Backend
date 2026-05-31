# Business Management System — Backend

> A production-grade multi-tenant REST API for invoicing, payments, and business operations. Built to demonstrate real-world backend engineering: layered architecture, JWT + OAuth, role-based access control, MongoDB transactions, and aggregate pipelines.

**Stack**: Node.js · TypeScript · Express 5 · MongoDB · JWT · Passport.js · Cloudinary · Puppeteer · Resend  
**Repo**: [github.com/NHeroOP/Business-Management-System-Backend](https://github.com/NHeroOP/Business-Management-System-Backend)

---

## At a Glance

| | |
|---|---|
| Domain modules | 8 (auth, user, business, member, client, product, invoice, payment) |
| Database collections | 9 |
| Authentication methods | Local (JWT) + Google OAuth 2.0 |
| Middleware layers per request | 3 (verifyJWT → resolveWorkspace → requireRole) |
| Transactional workflows | 2 (invoice creation, payment recording) |
| Aggregation pipelines | 4 (invoices, clients, products, payments) |
| Multi-tenant support | ✅ Per-request workspace isolation |
| RBAC | ✅ OWNER / ADMIN / EMPLOYEE |
| PDF generation | ✅ Puppeteer + Handlebars |

---

## Overview

A single deployment serves multiple independent businesses. Each business has its own members, clients, products, invoices, and payments — with strict data isolation between tenants. The system models a real SaaS invoicing platform and solves the architectural problems those systems face: workspace isolation, team access control, atomic invoice numbering, and transactional payment recording.

→ [Architecture & Engineering Decisions](docs/ARCHITECTURE.md)  
→ [Database Design](docs/DATABASE.md)  
→ [API Reference](docs/API.md)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 18+ · TypeScript (strict, ESM) |
| Framework | Express 5 |
| Database | MongoDB + Mongoose 9 |
| Auth | JWT · Passport.js · Google OAuth 2.0 · bcrypt |
| File storage | Cloudinary + Multer |
| Email | Resend |
| PDF | Puppeteer + Handlebars |
| Pagination | mongoose-aggregate-paginate-v2 |
| Build | tsc + tsc-alias · tsx (dev) |

---

## Architecture

Every request to a business-scoped route passes through three middleware layers:

```
verifyJWT → resolveWorkspace → requireRole(roles) → Controller → Service → MongoDB
```

- **`verifyJWT`** — validates JWT from cookie or `Authorization` header; sets `req.user`
- **`resolveWorkspace`** — reads `x-business-id` header; validates `BusinessMember` record; sets `req.workspace` with the user's role in that business
- **`requireRole`** — composable factory; checks `req.workspace.role` against allowed roles

Each of the 8 domain modules follows the same pattern: `model → service → controller → route`. All business logic lives in the service layer; controllers are thin.

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for flow diagrams and detailed design decisions.

---

## Core Engineering Decisions

| Decision | Why It Matters |
|----------|---------------|
| `BusinessMember` as a join entity | A user holds different roles in different businesses; role is a property of the relationship, not the user |
| `InvoiceCounter` sequence document | `findOneAndUpdate + $inc + upsert` inside a MongoDB session guarantees gap-free `INV-YYYY-NNNN` sequences under concurrency — `MAX+1` races |
| Price snapshots on invoice items | Stores `name`, `price`, `total` at creation time; product price changes never corrupt historical invoices |
| Atomic payment + invoice closure | Payment creation and invoice `PAID` status update happen in a single MongoDB session — no split-brain state |
| Header-based workspace selection | Flat route structure; one authenticated session can switch business context per-request |
| Aggregate pipeline for invoice search | `$lookup` + post-join `$match` keeps cross-collection client search server-side |
| Soft deletes everywhere | `isArchived: boolean` on all models; full audit trail; no accidental data loss |

---

## Features

**Auth & Identity** — Register/login with JWT cookies, Google OAuth 2.0, secure password reset (SHA-256 hashed token, 10-min expiry), avatar upload

**Workspace & Team** — Create businesses, invite/remove members, per-request workspace switching, OWNER/ADMIN/EMPLOYEE roles

**Clients & Products** — Full CRUD with soft delete, paginated text search, product image upload, SKU support, PRODUCT/SERVICE types

**Invoices** — Atomic number generation, line-item price snapshots, tax/discount calculation, status lifecycle (DRAFT→SENT→PAID/OVERDUE/CANCELLED), email on SENT, PDF export

**Payments** — Record with method (CASH/UPI/BANK/CARD) and status; atomic invoice closure; paginated list with date range and status filters

---

## Database Design (Summary)

Nine collections. Key relationships:

- `User` ↔ `Business` via `BusinessMember` (carries `role`, `permissions[]`)
- `Business` owns `Client`, `Product`, `Invoice`, `Payment`, `InvoiceCounter`
- `Invoice` embeds `IInvoiceItem[]` (price-snapshotted line items)
- `Payment` references `Invoice`; closing a payment can atomically close the invoice

All models: `isArchived` soft delete · `timestamps` · `metadata: Record<string, unknown>` extensibility field.

See [docs/DATABASE.md](docs/DATABASE.md) for the full ER diagram and index strategy.

---

## Security

| Mechanism | Implementation |
|-----------|---------------|
| Passwords | bcrypt (10 rounds), pre-save hook |
| Tokens | HTTP-only cookies; also accepts `Authorization: Bearer` |
| Password reset | SHA-256 hashed token + 10-minute expiry |
| Workspace isolation | Every query scoped to `businessId`; membership validated per request |
| CORS | Explicit `CORS_ORIGIN` env var |
| File cleanup | Temp files deleted after Cloudinary upload regardless of outcome |

---

## Getting Started

**Prerequisites**: Node.js 18+, MongoDB replica set (Atlas free tier works), Cloudinary account

```bash
git clone https://github.com/NHeroOP/Business-Management-System-Backend.git
cd Business-Management-System-Backend
npm install
cp .env.example .env   # fill in values
npm run dev
```

```bash
npm run build && npm start   # production
```

### Required Environment Variables

| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | Replica set URI (required for transactions) |
| `CORS_ORIGIN` | Allowed origin |
| `ACCESS_TOKEN_SECRET` / `ACCESS_TOKEN_EXPIRY` | e.g. `15m` |
| `REFRESH_TOKEN_SECRET` / `REFRESH_TOKEN_EXPIRY` | e.g. `7d` |
| `CLOUDINARY_CLOUD_NAME` / `_API_KEY` / `_API_SECRET` | File storage |
| `GOOGLE_CLIENT_ID` / `_SECRET` / `GOOGLE_CALLBACK_URL` | Optional — OAuth |
| `BASE_URL` | Optional — production domain for reset links |

---

## Future Improvements

| Priority | Item |
|----------|------|
| 🔴 High | Integration tests (Vitest + Supertest) |
| 🔴 High | Request validation (Zod) |
| 🔴 High | Global error handler in `app.ts` |
| 🟡 Medium | Docker + docker-compose with replica set |
| 🟡 Medium | OpenAPI / Swagger docs |
| 🟡 Medium | Structured logging (Pino) + request ID |
| 🟡 Medium | Rate limiting + helmet |
| 🟢 Low | Background jobs — BullMQ + Redis (email, PDF) |
| 🟢 Low | Refresh token rotation |
| 🟢 Low | Analytics endpoints (revenue by period, invoice aging) |

---

## Why This Project Is Valuable

This is not a CRUD application. It solves the architectural problems that appear in real SaaS backends.

| Skill | Evidence in this project |
|-------|--------------------------|
| System design | Multi-tenancy model, workspace isolation, RBAC architecture |
| Database expertise | Transactions, compound indexes, aggregation pipelines, sequence documents |
| Security | HTTP-only cookies, hashed reset tokens, bcrypt, workspace-scoped queries |
| Domain modeling | Price snapshots, join entities, soft deletes, status lifecycles |
| API design | Consistent response envelope, RESTful conventions, pagination on all lists |
| TypeScript | Strict mode, declaration merging, typed interfaces throughout |

---

## Resume Highlights

- Architected a multi-tenant REST API in Node.js/TypeScript serving multiple isolated business workspaces from a single deployment, with per-request workspace resolution via a custom Express middleware chain
- Implemented role-based access control (OWNER/ADMIN/EMPLOYEE) enforced at the middleware layer using a composable `requireRole` guard backed by a `BusinessMember` join entity that decouples identity from workspace membership
- Designed atomic invoice number generation using MongoDB transactions and a dedicated `InvoiceCounter` sequence collection with a compound unique index, guaranteeing gap-free `INV-YYYY-NNNN` sequences under concurrent requests
- Built a transactional payment system that atomically records payments and marks invoices as `PAID` within a single MongoDB session, preventing inconsistent state between payment and invoice records
- Implemented JWT authentication with HTTP-only cookie storage, Google OAuth 2.0 via Passport.js, and a secure password reset flow using SHA-256 hashed tokens with 10-minute expiry
- Engineered invoice line-item price snapshotting to preserve financial accuracy when product prices change after invoice creation — a deliberate denormalization for correctness
- Built paginated invoice search using MongoDB aggregation pipelines with `$lookup` + post-join `$match` for cross-collection client name/email filtering
- Applied TypeScript strict mode with custom Express request augmentation (`req.user`, `req.workspace`) via declaration merging for end-to-end type safety across the middleware chain
