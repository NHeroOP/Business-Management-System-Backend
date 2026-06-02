# API Reference

All endpoints are prefixed with `/api/v1`.

## Response Envelope

**Success**
```json
{ "statusCode": 200, "data": {}, "message": "Success", "success": true }
```

**Validation error** (ZodError → 400)
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [{ "field": "email", "message": "Invalid email address" }]
}
```

**Application error**
```json
{ "success": false, "message": "Invoice not found" }
```

## Authentication Headers

Business-scoped routes require both headers:

```
Authorization: Bearer <accessToken>
x-business-id: <businessId>
```

JWT can also be sent via `accessToken` cookie.

---

## Auth — `/api/v1/auth`

Rate-limited.

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| POST | `/register` | — | `multipart/form-data`; fields: `name`, `email`, `username`, `password`, `avatarUrl` |
| POST | `/login` | — | `{ email?, username?, password }` · Sets httpOnly cookies |
| POST | `/logout` | JWT | Clears cookies; unsets `refreshToken` in DB |
| POST | `/refresh-token` | — | `{ incomingRefreshToken }` or cookie · Issues new token pair |
| GET | `/me` | JWT | Returns current user |
| POST | `/forgot-password` | — | `{ email }` · Sends SHA-256 reset token via Resend |
| POST | `/reset-password` | — | `{ token, userId, newPassword }` |
| GET | `/google` | — | Redirects to Google OAuth |
| GET | `/google/callback` | — | OAuth callback; sets JWT cookies |

---

## Users — `/api/v1/users`

All routes require `verifyJWT`.

| Method | Path | Notes |
|--------|------|-------|
| GET | `/me` | Current user profile |
| PATCH | `/me` | `{ name? }` |
| PATCH | `/change-password` | `{ currentPassword, newPassword }` |
| PATCH | `/update-avatar` | `multipart/form-data`; field `avatarUrl` |
| GET | `/:userId` | User by ID |

---

## Businesses — `/api/v1/businesses`

All routes require `verifyJWT`. No workspace resolution — uses `:businessId` path param.

| Method | Path | Role | Notes |
|--------|------|------|-------|
| POST | `/` | JWT | `multipart/form-data`; field `logoUrl`; auto-creates `OWNER` membership |
| GET | `/:businessId` | JWT | — |
| PATCH | `/:businessId` | OWNER | Update name / settings |
| PATCH | `/:businessId/logo` | OWNER | `multipart/form-data`; field `logoUrl` |

---

## Business Members — `/api/v1/business-members`

All routes require `verifyJWT + resolveWorkspace`.

| Method | Path | Role | Notes |
|--------|------|------|-------|
| GET | `/` | ALL | List members |
| POST | `/` | OWNER, ADMIN | `{ userId, role? }` · Re-activates archived member if exists |
| DELETE | `/:memberId` | OWNER, ADMIN | Soft delete |
| PATCH | `/:memberId/role` | OWNER, ADMIN | `{ role }` |

---

## Clients — `/api/v1/clients`

All routes require `verifyJWT + resolveWorkspace`.

| Method | Path | Query | Notes |
|--------|------|-------|-------|
| GET | `/` | `page, limit, search, sortBy` | Paginated |
| POST | `/` | — | Body below |
| GET | `/:clientId` | — | — |
| PATCH | `/:clientId` | — | Partial update |
| DELETE | `/:clientId` | — | Soft delete |

**POST `/clients` body:**
```json
{
  "name": "Acme Corp",
  "email": "billing@acme.com",
  "phone": "+91 98765 43210",
  "address": "123 Main St",
  "companyName": "Acme Corporation",
  "gstNumber": "22AAAAA0000A1Z5",
  "notes": "Net-30 payment terms",
  "tags": ["enterprise"]
}
```

---

## Products — `/api/v1/products`

All routes require `verifyJWT + resolveWorkspace`.

| Method | Path | Query | Notes |
|--------|------|-------|-------|
| GET | `/` | `page, limit, search, sortBy` | Paginated |
| POST | `/` | — | `multipart/form-data`; field `imageUrl` |
| GET | `/:productId` | — | — |
| PATCH | `/:productId` | — | Partial update |
| DELETE | `/:productId` | — | Soft delete |

---

## Invoices — `/api/v1/invoices`

All routes require `verifyJWT + resolveWorkspace + requireRole(ALL)`.

| Method | Path | Notes |
|--------|------|-------|
| GET | `/` | Query: `page, limit, name, email, sortBy, sortOrder`. Client search runs server-side via aggregation pipeline |
| POST | `/` | Atomic number generation; price snapshots applied server-side |
| GET | `/:id` | Populates `client` |
| PATCH | `/:id` | Update items / tax / discount / dueDate / notes; recalculates totals |
| DELETE | `/:id` | Soft delete |
| PATCH | `/:id/status` | `{ status }` — see transitions below |
| GET | `/:id/pdf` | Returns `application/pdf` |

**POST `/invoices` body:**
```json
{
  "clientId": "64f1a2b3c4d5e6f7a8b9c0d1",
  "items": [
    { "productId": "64f1a2b3c4d5e6f7a8b9c0d2", "quantity": 3 }
  ],
  "tax": 18,
  "discount": 5,
  "dueDate": "2025-12-31",
  "notes": "Due within 30 days"
}
```

**Response:**
```json
{
  "statusCode": 201,
  "data": {
    "invoiceNumber": "INV-2025-0042",
    "subtotal": 1500,
    "tax": 18,
    "discount": 5,
    "total": 1491,
    "status": "DRAFT"
  },
  "success": true
}
```

**Status transitions:**  
`SENT` triggers a client email via Resend. `PAID` can be set manually here, but the canonical path is via `POST /payments` (atomic with payment record).

---

## Payments — `/api/v1/payments`

All routes require `verifyJWT + resolveWorkspace + requireRole(ALL)`.

| Method | Path | Query | Notes |
|--------|------|-------|-------|
| GET | `/` | `page, limit, invoiceId?, status?, method?, fromDate?, toDate?` | Paginated |
| POST | `/` | — | Atomically records payment + closes invoice in one session |
| GET | `/:paymentId` | — | — |

**POST `/payments` body:**
```json
{
  "invoiceId": "64f1a2b3c4d5e6f7a8b9c0d3",
  "amount": 1491,
  "method": "UPI",
  "transactionId": "TXN123456",
  "notes": "Paid via Google Pay"
}
```

If `amount >= invoice.total`, invoice status is atomically updated to `PAID` in the same MongoDB session.

---

## Pagination Response Shape

All paginated endpoints return:

```json
{
  "docs": [],
  "totalDocs": 42,
  "limit": 10,
  "page": 1,
  "totalPages": 5,
  "hasNextPage": true,
  "hasPrevPage": false
}
```

---

## Error Reference

| Status | Cause |
|--------|-------|
| 400 | Validation failure (ZodError) or bad business logic (e.g. negative discount) |
| 401 | Missing or invalid JWT |
| 403 | Valid JWT but no membership in the requested workspace, or insufficient role |
| 404 | Resource not found |
| 409 | Conflict — duplicate username/email, or invoice already paid |
| 500 | Unhandled server error (stack trace included in `development`) |
