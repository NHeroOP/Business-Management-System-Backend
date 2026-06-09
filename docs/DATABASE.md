# Database Design

## Entity Relationships

```
User ──< BusinessMember >── Business
                               │
              ┌────────────────┼──────────────────┐
              │                │                  │
           Client           Product          InvoiceCounter
              │                │               (per business/year)
              └────> Invoice <─┘
                       │
                    Payment
```

One `User` can be a member of many `Business`es. Each `BusinessMember` record carries the `role` for that relationship. All domain collections are scoped to a `businessId`.

## Collections

### User

| Field | Type | Notes |
|-------|------|-------|
| `username` | String | Unique, indexed, lowercase |
| `email` | String | Unique, indexed, lowercase |
| `password` | String | bcrypt hashed; absent for Google-only accounts |
| `googleId` | String | Set on OAuth login |
| `provider` | `"local" \| "google"` | Default `"local"` |
| `avatar` | `{ url, publicId }` | Cloudinary reference |
| `refreshToken` | String | Stored for rotation validation |
| `passwordResetToken` | String | SHA-256 hash of raw token |
| `passwordResetTokenExpiry` | Date | 10-minute window |
| `isVerified` | Boolean | Default `false` |
| `isArchived` | Boolean | Soft delete |

Instance methods: `generateAccessToken()`, `generateRefreshToken()`, `isPasswordCorrect(password)`  
Pre-save hook: bcrypt hashes `password` on modification.

---

### Business

| Field | Type | Notes |
|-------|------|-------|
| `name` | String | Required |
| `slug` | String | Unique; auto-generated via `slugify` |
| `createdBy` | ObjectId | ref: User |
| `logo` | `{ url, publicId }` | Cloudinary reference |
| `settings.currency` | String | Default `"INR"` |
| `settings.invoicePrefix` | String | Default `"INV"` |
| `settings.enableTaxes` | Boolean | Default `true` |
| `settings.taxPercentage` | Number | Default `18` |
| `isArchived` | Boolean | Soft delete |

---

### BusinessMember

| Field | Type | Notes |
|-------|------|-------|
| `businessId` | ObjectId | ref: Business, indexed |
| `userId` | ObjectId | ref: User, indexed |
| `role` | `OWNER \| ADMIN \| EMPLOYEE` | Default `EMPLOYEE` |
| `permissions` | String[] | Reserved for fine-grained control |
| `isArchived` | Boolean | Soft delete (inactive member) |

Compound unique index: `{ businessId, userId }` — one active membership per user per business.

---

### Client

| Field | Type | Notes |
|-------|------|-------|
| `businessId` | ObjectId | ref: Business, indexed |
| `name` | String | Required; text-indexed |
| `email` | String | — |
| `phone` | String | — |
| `address` | String | — |
| `companyName` | String | — |
| `gstNumber` | String | — |
| `tags` | String[] | — |
| `isArchived` | Boolean | Soft delete |

---

### Product

| Field | Type | Notes |
|-------|------|-------|
| `businessId` | ObjectId | ref: Business, indexed |
| `name` | String | Required |
| `type` | `PRODUCT \| SERVICE` | Default `PRODUCT` |
| `description` | String | — |
| `price` | Number | Required, non-negative |
| `sku` | String | Sparse compound unique index `{ sku, businessId }` — per-business uniqueness |
| `image` | `{ url, publicId }` | Cloudinary reference |
| `isArchived` | Boolean | Soft delete |

---

### Invoice

| Field | Type | Notes |
|-------|------|-------|
| `invoiceNumber` | String | Unique; format `INV-YYYY-NNNN` |
| `businessId` | ObjectId | ref: Business, indexed |
| `client` | ObjectId | ref: Client, indexed |
| `items` | `IInvoiceItem[]` | Embedded; price-snapshotted at creation |
| `subtotal` | Number | Sum of `item.total` |
| `tax` | Number | Percentage (0–100); default `0` |
| `discount` | Number | Percentage (0–100); default `0` |
| `total` | Number | `subtotal → apply discount → apply tax` |
| `currency` | String | Default `"INR"` |
| `status` | Enum | `DRAFT \| SENT \| PAID \| OVERDUE \| CANCELLED` |
| `issuedDate` | Date | Default: today at UTC midnight |
| `dueDate` | Date | Optional |
| `notes` | String | Optional |
| `createdBy` | ObjectId | ref: User |
| `paidAt` | Date | Set on payment closure |
| `isArchived` | Boolean | Soft delete |

**IInvoiceItem** (embedded subdocument, no `_id`):

| Field | Notes |
|-------|-------|
| `productId` | Retained for traceability only — never used to re-derive pricing |
| `name` | Snapshot at creation time |
| `price` | Snapshot at creation time |
| `quantity` | — |
| `total` | `price × quantity`; snapshot |

---

### Payment

| Field | Type | Notes |
|-------|------|-------|
| `businessId` | ObjectId | ref: Business, indexed |
| `invoiceId` | ObjectId | ref: Invoice |
| `amount` | Number | Required |
| `method` | `CASH \| UPI \| BANK \| CARD` | Default `CASH` |
| `status` | `SUCCESS \| PENDING \| FAILED` | Default `SUCCESS` |
| `transactionId` | String | External reference; optional |
| `notes` | String | Optional |
| `paidAt` | Date | Default: now |
| `createdBy` | ObjectId | ref: User |
| `isArchived` | Boolean | Soft delete |

---

### InvoiceCounter

| Field | Type | Notes |
|-------|------|-------|
| `businessId` | ObjectId | ref: Business |
| `year` | Number | Calendar year |
| `sequence` | Number | Auto-incremented; default `0` |

Compound unique index: `{ businessId, year }`. Incremented via `findOneAndUpdate + $inc + upsert` inside a MongoDB session alongside `Invoice.create`.

---

## Index Strategy

| Collection | Index | Type | Purpose |
|-----------|-------|------|---------|
| `users` | `username` | Unique | Login lookup |
| `users` | `email` | Unique | Login + duplicate check |
| `users` | `passwordResetToken` | Standard | Reset token lookup |
| `businesses` | `slug` | Unique | URL routing |
| `businessmembers` | `businessId` | Standard | Member listing |
| `businessmembers` | `userId` | Standard | Workspace resolution |
| `businessmembers` | `{ businessId, userId }` | Compound unique | One membership per user per business |
| `clients` | `businessId` | Standard | Tenant scoping |
| `clients` | `name` | Text | Search |
| `products` | `businessId` | Standard | Tenant scoping |
| `products` | `{ sku, businessId }` | Compound sparse unique | Per-business SKU uniqueness |
| `invoices` | `invoiceNumber` | Unique | Number uniqueness |
| `invoices` | `{ businessId, invoiceNumber }` | Compound unique | — |
| `invoices` | `{ businessId, status, createdAt }` | Compound | Status filtering |
| `invoices` | `{ businessId, client, createdAt }` | Compound | Client invoice listing |
| `invoicecounters` | `{ businessId, year }` | Compound unique | Sequence atomicity |
| `payments` | `{ businessId, paidAt }` | Compound | Date range queries |
| `payments` | `{ businessId, invoiceId }` | Compound | Invoice payment lookup |
| `payments` | `{ businessId, status }` | Compound | Status filtering |

## Common Patterns

All collections share:

- `isArchived: boolean` (default `false`) — soft delete; all queries filter `{ isArchived: false }`
- `timestamps: true` — Mongoose adds `createdAt`, `updatedAt`
- `businessId` on all tenant-scoped documents — every query includes tenant isolation at the DB layer
