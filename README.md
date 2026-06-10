# Business Management System — Backend

A multi-tenant REST API for invoicing, payments, and business operations. Models a real SaaS invoicing platform and solves the core architectural problems those systems face: per-tenant data isolation, concurrent invoice numbering, transactional payment recording, and financial record immutability.

**Stack**: Node.js · TypeScript · Express 5 · MongoDB · JWT · Passport.js · Cloudinary · Puppeteer · Resend

---

## Key Features

- **Multi-tenancy** — per-request workspace isolation via `x-business-id` header and `BusinessMember` join entity; one deployment serves multiple independent businesses
- **RBAC** — `OWNER / ADMIN / EMPLOYEE` roles enforced at the middleware layer via a composable `requireRole` factory
- **Atomic invoice numbering** — `InvoiceCounter` sequence using `findOneAndUpdate + $inc + upsert` inside a MongoDB session; gap-free `INV-YYYY-NNNN` sequences under concurrency
- **Transactional payments** — payment recording and invoice `PAID` closure in a single MongoDB session; split-brain impossible
- **Price snapshots** — invoice items capture `name`, `price`, and `total` at creation time; product price changes never corrupt historical records
- **Aggregation pipeline search** — invoice search by client name/email via `$lookup` + post-join `$match`; filtering stays server-side
- **Soft deletes** — `isArchived` on all models; full audit trail, no data loss
- **PDF generation** — Puppeteer + Handlebars invoice PDFs
- **Auth** — JWT cookies, Google OAuth 2.0, SHA-256 hashed password reset tokens with 10-minute expiry
- **Analytics** — business-level stats endpoint (clients, products, services, invoices, payments, revenue)
- **Env validation** — all required environment variables are validated at startup via Zod; the process exits immediately if any are missing

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Bun · Node.js 18+ · TypeScript 6 (strict, ESM) |
| Framework | Express 5 |
| Database | MongoDB + Mongoose 9 |
| Auth | JWT · Passport.js · Google OAuth 2.0 · bcrypt |
| File storage | Cloudinary + Multer |
| Email | Resend |
| PDF | Puppeteer (puppeteer-core) + Handlebars |
| Validation | Zod 4 |
| Testing | Vitest · Supertest · mongodb-memory-server |

---

## Architecture

Every business-scoped request passes through three middleware layers:

```
verifyJWT → resolveWorkspace → requireRole(roles) → Controller → Service → MongoDB
```

- `verifyJWT` — validates JWT from cookie or `Authorization` header; sets `req.user`
- `resolveWorkspace` — reads `x-business-id` header; validates `BusinessMember`; sets `req.workspace`
- `requireRole` — composable factory; checks `req.workspace.role` against allowed roles

Nine domain modules, each following the same layered pattern:

```
model → validation → service → controller → route
```

All business logic lives in the service layer. Controllers are thin wrappers: parse input, call service, return `ApiResponse`.

`req.user` and `req.workspace` are typed via declaration merging in `src/shared/@types/express/index.d.ts` — no unsafe casts anywhere in the middleware chain.

→ [Architecture & Engineering Decisions](docs/ARCHITECTURE.md)  
→ [Database Design](docs/DATABASE.md)  
→ [API Reference](docs/API.md)  
→ [Security](docs/SECURITY.md)

---

## Engineering Decisions

| Decision | Why |
|----------|-----|
| `BusinessMember` as join entity | Role is a property of the relationship, not the user — one user can be OWNER in one business and EMPLOYEE in another |
| `InvoiceCounter` sequence document | `MAX+1` races under concurrency — `findOneAndUpdate + $inc + upsert` inside a session guarantees no duplicates |
| Price snapshots on invoice items | Product price changes must never corrupt historical invoices — deliberate denormalization for financial correctness |
| Atomic payment + invoice closure | Two writes in one session — prevents split-brain between payment records and invoice status |
| Header-based workspace selection | Flat routes; one authenticated session switches business context per-request without re-authentication |
| `src/env.ts` Zod validation | Fail-fast at startup — missing or malformed env vars exit the process immediately with a clear error |

---

## Getting Started

**Prerequisites**: Bun (or Node.js 18+), MongoDB replica set (Atlas free tier works), Cloudinary account

```bash
git clone https://github.com/NHeroOP/Business-Management-System-Backend.git
cd Business-Management-System-Backend
bun install
cp .env.example .env   # fill in values
bun run dev
```

```bash
bun run build && bun start   # production (runs via Bun)
```

### Docker

```bash
docker compose up
```

The `Dockerfile` uses a multi-stage Bun build and installs Chromium for Puppeteer. Set `PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium` (the default in Docker).

### Environment Variables

```bash
# Required — no defaults, process exits if missing
MONGODB_URI=""              # Replica set URI — transactions require a replica set
ACCESS_TOKEN_SECRET=""      # Min 32 characters
REFRESH_TOKEN_SECRET=""     # Min 32 characters
CLOUDINARY_CLOUD_NAME=""
CLOUDINARY_API_KEY=""
CLOUDINARY_API_SECRET=""
RESEND_API_KEY=""
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# Optional (defaults shown)
PORT=8000
NODE_ENV=development
BASE_URL=http://localhost:3000
CORS_ORIGIN=*
ACCESS_TOKEN_EXPIRY="1d"
REFRESH_TOKEN_EXPIRY="15d"
GOOGLE_CALLBACK_URL="http://localhost:3000/api/v1/auth/google/callback"
PUPPETEER_EXECUTABLE_PATH="/usr/bin/chromium-browser"
```

See `.env.example` for the full list.

---

## API

All endpoints under `/api/v1`. Business-scoped routes require:

```
Authorization: Bearer <token>    (or accessToken cookie)
x-business-id: <id>
```

| Prefix | Module |
|--------|--------|
| `/api/v1/auth` | auth |
| `/api/v1/users` | user |
| `/api/v1/businesses` | business |
| `/api/v1/business-members` | business-member |
| `/api/v1/clients` | client |
| `/api/v1/products` | product |
| `/api/v1/invoices` | invoice |
| `/api/v1/payments` | payment |
| `/api/v1/analytics` | analytics |
| `/api/v1/health` | health check |

See [docs/API.md](docs/API.md) for the full reference.

---

## Testing

**Stack**: Vitest · Supertest · mongodb-memory-server · @faker-js/faker

```bash
bun run test
```

Integration tests go through the full HTTP stack via Supertest against a real in-memory MongoDB replica set (transactions require a replica set). Unit tests cover pure calculation logic.

Mocks are provided for Cloudinary, Resend, and bcrypt in `tests/mocks/`. Path aliases: `@/` → `src/`, `@tests/` → `tests/`.
