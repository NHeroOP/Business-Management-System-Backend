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
| `name` | String | Required |
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
| `lastLoginAt` | Date | Optional; updated on login |
| `verificationCode` | String | Optional |
| `verificationCodeExpiry` | Date | Optional |
| `passwordChangedAt` | Date | Optional |
| `metadata` | Mixed | Reserved for extensibility |
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
| `permissions` | String[] | Reserved for fine-grained control; default `[]` |
| `isArchived` | Boolean | Soft delete (inactive member) |

Compound unique index: `{ businessId, userId }` — one membership record per user per business.

---

### Client

| Field | Type | Notes |
|-------|------|-------|
| `businessId` | ObjectId | ref: Business |
| `name` | String | Required |
| `email` | String | Optional |
| `phone` | String | Optional |
| `address` | String | Optional |
| `companyName` | String | Optional |
| `gstNumber` | String | Optional |
| `notes` | String | Optional |
| `tags` | String[] | Default `[]` |
| `createdBy` | ObjectId | ref: User |
| `metadata` | Mixed | Reserved for extensibility |
| `isArchived` | Boolean | Soft delete |

---

### Product

| Field | Type | Notes |
|-------|------|-------|
| `businessId` | ObjectId | ref: Business, indexed |
| `name` | String | Required |
| `type` | `PRODUCT \| SERVICE` | Default `PRODUCT` |
| `description` | String | Optional |
| `price` | Number | Required, default `0` |
| `stockQuantity` | Number | Default `0` |
| `sku` | String | Sparse compound unique index `{ sku, businessId }` — per-business uniqueness |
| `category` | String | Optional |
| `image` | `{ url, publicId }` | Cloudinary reference |
| `createdBy` | ObjectId | ref: User |
| `metadata` | Mixed | Reserved for extensibility |
| `isArchived` | Boolean | Soft delete |

---

### Invoice

| Field | Type | Notes |
|-------|------|-------|
| `invoiceNumber` | String | Unique; format `{PREFIX}-YYYY-NNNN` |
| `businessId` | ObjectId | ref: Business, indexed |
| `client` | ObjectId | ref: Client, indexed |
| `items` | `IInvoiceItem[]` | Embedded; price-snapshotted at creation |
| `subtotal` | Number | Sum of `item.total` |
| `tax` | Number | Percentage (0–100); default `0` |
| `discount` | Number | Percentage (0–100); default `0` |
| `total` | Number | `subtotal → apply discount → apply tax` |
| `currency` | String | Default `"INR"` |
| `status` | Enum | `DRAFT \| SENT \| PAID \| OVERDUE \| CANCELLED`; indexed |
| `issuedDate` | Date | Default: today at UTC midnight |
| `dueDate` | Date | Optional |
| `notes` | String | Optional |
| `createdBy` | ObjectId | ref: User |
| `paidAt` | Date | Set on payment closure |
| `metadata` | Mixed | Reserved for extensibility |
| `isArchived` | Boolean | Soft delete |

**IInvoiceItem** (embedded subdocument, no `_id`):

| Field | Notes |
|-------|-------|
| `productId` | Optional; retained for traceability only — never used to re-derive pricing |
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
| `metadata` | Mixed | Reserved for extensibility |
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
| `clients` | `{ name (text), businessId, createdAt }` | Compound text | Tenant-scoped text search |
| `products` | `businessId` | Standard | Tenant scoping |
| `products` | `{ businessId, createdAt }` | Compound | Sorted listing |
| `products` | `{ sku, businessId }` | Compound sparse unique | Per-business SKU uniqueness |
| `invoices` | `invoiceNumber` | Unique | Number uniqueness |
| `invoices` | `businessId` | Standard | Tenant scoping |
| `invoices` | `client` | Standard | Client invoice lookup |
| `invoices` | `status` | Standard | Status filtering |
| `invoices` | `{ businessId, invoiceNumber }` | Compound unique | — |
| `invoices` | `{ businessId, status, createdAt }` | Compound | Status + date filtering |
| `invoices` | `{ businessId, client, createdAt }` | Compound | Client invoice listing |
| `invoicecounters` | `{ businessId, year }` | Compound unique | Sequence atomicity |
| `payments` | `businessId` | Standard | Tenant scoping |
| `payments` | `{ businessId, paidAt }` | Compound | Date range queries |
| `payments` | `{ businessId, invoiceId }` | Compound | Invoice payment lookup |
| `payments` | `{ businessId, status }` | Compound | Status filtering |

## Common Patterns

All collections share:

- `isArchived: boolean` (default `false`) — soft delete; all queries filter `{ isArchived: false }`
- `timestamps: true` — Mongoose adds `createdAt`, `updatedAt`
- `businessId` on all tenant-scoped documents — every query includes tenant isolation at the DB layer
- `metadata: Mixed` on User, Client, Product, Invoice, and Payment — reserved for future extensibility; not exposed in API responses
- `createdBy: ObjectId` on Client, Product, Invoice, and Payment — audit trail
