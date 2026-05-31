# API Reference

All endpoints are prefixed with `/api/v1`.

**Response envelope** (all endpoints):
```json
{ "statusCode": 200, "data": {}, "message": "Success", "success": true }
```

**Business-scoped requests** require:
```
x-business-id: <businessId>
Authorization: Bearer <accessToken>   (or cookie)
```

---

## Authentication — `/api/v1/auth`

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| POST | `/register` | — | `multipart/form-data`; field `avatarUrl` required |
| POST | `/login` | — | Sets `accessToken` + `refreshToken` HTTP-only cookies |
| POST | `/logout` | JWT | Clears cookies; unsets `refreshToken` in DB |
| GET | `/me` | JWT | Returns current user |
| POST | `/forgot-password` | — | Sends reset email via Resend |
| POST | `/reset-password` | — | Body: `{ token, userId, newPassword }` |
| GET | `/google` | — | Redirects to Google OAuth |
| GET | `/google/callback` | — | OAuth callback; sets JWT cookies |

### Login Example
```http
POST /api/v1/auth/login
Content-Type: application/json

{ "email": "user@example.com", "password": "secret" }
```
```json
{
  "statusCode": 200,
  "data": { "_id": "...", "name": "Jane", "email": "user@example.com" },
  "message": "Login successful",
  "success": true
}
```

---

## Users — `/api/v1/users`

All routes require `verifyJWT`.

| Method | Path | Notes |
|--------|------|-------|
| GET | `/me` | Get own profile |
| PATCH | `/me` | Update name |
| PATCH | `/change-password` | Body: `{ currentPassword, newPassword }` |
| PATCH | `/update-avatar` | `multipart/form-data`; field `avatarUrl` |
| GET | `/:id` | Get user by ID |

---

## Businesses — `/api/v1/businesses`

All routes require `verifyJWT`. No `resolveWorkspace` — uses `:businessId` path param.

| Method | Path | Role | Notes |
|--------|------|------|-------|
| POST | `/` | JWT | `multipart/form-data`; field `logoUrl`; auto-creates OWNER membership |
| GET | `/:businessId` | JWT | — |
| PATCH | `/:businessId` | OWNER | Update details |
| PATCH | `/:businessId/logo` | OWNER | `multipart/form-data`; field `logoUrl` |

---

## Business Members — `/api/v1/business-members`

All routes require `verifyJWT + resolveWorkspace`.

| Method | Path | Role | Notes |
|--------|------|------|-------|
| GET | `/` | ALL | List members |
| POST | `/` | OWNER, ADMIN | Invite member; re-activates if archived |
| DELETE | `/:memberId` | OWNER, ADMIN | Soft delete |
| PATCH | `/:memberId/role` | OWNER, ADMIN | Change role |

---

## Clients — `/api/v1/clients`

All routes require `verifyJWT + resolveWorkspace + requireRole(ALL)`.

| Method | Path | Query | Notes |
|--------|------|-------|-------|
| GET | `/` | `page, limit, search` | Paginated; text search on `name` |
| POST | `/` | — | — |
| GET | `/:clientId` | — | — |
| PATCH | `/:clientId` | — | — |
| DELETE | `/:clientId` | — | Soft delete |

---

## Products — `/api/v1/products`

All routes require `verifyJWT + resolveWorkspace`. No `requireRole` — any workspace member.

| Method | Path | Query | Notes |
|--------|------|-------|-------|
| GET | `/` | `page, limit, search, sortBy` | Paginated |
| POST | `/` | — | `multipart/form-data`; field `imageUrl` |
| GET | `/:productId` | — | — |
| PATCH | `/:productId` | — | — |
| DELETE | `/:productId` | — | Soft delete |

---

## Invoices — `/api/v1/invoices`

All routes require `verifyJWT + resolveWorkspace + requireRole(ALL)`.

| Method | Path | Notes |
|--------|------|-------|
| GET | `/` | Paginated; query `page, limit, name, email` (client search via aggregation) |
| POST | `/` | Atomic number generation; price snapshots applied server-side |
| GET | `/:id` | Populates client |
| PATCH | `/:id` | Update items/tax/discount/dueDate/notes; recalculates totals |
| DELETE | `/:id` | Soft delete |
| PATCH | `/:id/status` | Body: `{ status }` |
| GET | `/:id/pdf` | Returns `application/pdf` |

### Create Invoice Example
```http
POST /api/v1/invoices
x-business-id: 64f1a2b3c4d5e6f7a8b9c0d0
Authorization: Bearer <token>
Content-Type: application/json

{
  "clientId": "64f1a2b3c4d5e6f7a8b9c0d1",
  "items": [
    { "productId": "64f1a2b3c4d5e6f7a8b9c0d2", "quantity": 3 }
  ],
  "tax": 18,
  "discount": 5,
  "dueDate": "2025-12-31"
}
```
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

---

## Payments — `/api/v1/payments`

All routes require `verifyJWT + resolveWorkspace + requireRole(ALL)`.

| Method | Path | Query | Notes |
|--------|------|-------|-------|
| GET | `/` | `page, limit, invoiceId, status, method, fromDate, toDate` | Paginated |
| POST | `/` | — | Atomically closes invoice if `amount >= invoice.total` |
| GET | `/:paymentId` | — | — |

### Create Payment Example
```http
POST /api/v1/payments
x-business-id: 64f1a2b3c4d5e6f7a8b9c0d0
Authorization: Bearer <token>
Content-Type: application/json

{
  "invoiceId": "64f1a2b3c4d5e6f7a8b9c0d3",
  "amount": 1491,
  "method": "UPI"
}
```
```json
{
  "statusCode": 201,
  "data": { "amount": 1491, "method": "UPI", "status": "SUCCESS" },
  "message": "Payment recorded",
  "success": true
}
```
Invoice status is atomically updated to `PAID` in the same MongoDB session.

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
