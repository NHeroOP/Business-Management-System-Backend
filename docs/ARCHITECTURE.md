# Architecture & Engineering Decisions

## Request Flow

```
Client
  │
  ├── /api/v1/auth/*          verifyJWT (select routes) → Controller
  ├── /api/v1/users/*         verifyJWT → Controller
  ├── /api/v1/businesses/*    verifyJWT → Controller           (no resolveWorkspace — uses :businessId param)
  └── /api/v1/{domain}/*      verifyJWT → resolveWorkspace → requireRole(roles) → Controller → Service → MongoDB
                                                                                                         ↓
                                                                                               Cloudinary / Resend
```

## Middleware Chain

| Middleware | File | Input | Output | On Failure |
|-----------|------|-------|--------|-----------|
| `verifyJWT` | `auth.middleware.ts` | Cookie or `Authorization` header | `req.user` | 401 |
| `resolveWorkspace` | `workspace.middleware.ts` | `x-business-id` header + `req.user._id` | `req.workspace` | 400 / 403 |
| `requireRole(roles)` | `rbac.middleware.ts` | `req.workspace.role` | — | 403 |

Business routes (`/businesses/:businessId`) skip `resolveWorkspace` — the path param provides business context directly.

### TypeScript Request Augmentation

`req.user` and `req.workspace` are typed via declaration merging in `src/shared/@types/express/index.d.ts`:

```typescript
declare module "express-serve-static-core" {
  interface Request {
    user?: Pick<IUserDocument, "_id" | "email" | "name" | "username">;
    workspace?: {
      membershipId: IBusinessMemberDocument["_id"];
      businessId:   IBusinessMemberDocument["businessId"];
      role:         IBusinessMemberDocument["role"];
    };
  }
}
```

No unsafe casts anywhere in the middleware chain.

## Module Pattern

All 8 domain modules follow the same 4-layer structure:

```
src/modules/{domain}/
  {Domain}.model.ts       Mongoose schema + TypeScript interface + indexes + plugins
  {domain}.validation.ts  Zod schemas; inferred types used as service input types
  {domain}.service.ts     Business logic, DB queries, external service calls
  {domain}.controller.ts  Parse request → call service → send ApiResponse
  {domain}.route.ts       Route definitions + middleware chain composition
```

Controllers call `schema.parse(req.body)` / `schema.parse(req.params)` directly — no separate validation middleware. Zod-inferred types (`z.infer<typeof schema>`) are the service input types, enforcing the controller → service contract at compile time.

## Error Handling

A global error handler in `src/shared/middlewares/errorHandler.ts` is registered last in `app.ts`:

```typescript
export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof ZodError) {
    return res.status(400).json({ success: false, message: "Validation failed", errors: error.issues });
  }
  if (error instanceof ApiError) {
    return res.status(error.statusCode).json({ success: false, message: error.message });
  }
  return res.status(500).json({ success: false, message: "Internal Server Error" });
};
```

Stack traces are included only in `NODE_ENV=development`.

## Authentication Flows

### Local Login

```
POST /auth/login { email or username, password }
  → User.findOne({ email } or { username })
  → bcrypt.compare(password, user.password)
  → jwt.sign → accessToken + refreshToken
  → user.refreshToken = refreshToken (persisted)
  → Set-Cookie: accessToken + refreshToken (httpOnly)
```

### Token Refresh

```
POST /auth/refresh-token { incomingRefreshToken }
  → jwt.verify → User.findById
  → compare stored refreshToken === incoming
  → issue new accessToken + refreshToken pair
```

### Google OAuth 2.0

```
GET /auth/google → Passport redirect to Google (profile + email scope)
Google callback → findOne({ googleId } or { email })
  → create user if new (no password field)
  → issue JWT cookies → redirect to client
```

### Password Reset

```
POST /auth/forgot-password { email }
  → crypto.randomBytes(32) → rawToken
  → SHA-256(rawToken) → hashedToken stored in DB
  → user.passwordResetTokenExpiry = now + 10 minutes
  → Resend: reset URL with rawToken (never stored)

POST /auth/reset-password { token, userId, newPassword }
  → SHA-256(token) → hash
  → User.findOne({ _id: userId, passwordResetToken: hash })
  → verify expiry → set new bcrypt-hashed password → clear reset fields
```

## Multi-Tenancy Design

```
Request + x-business-id header
  → BusinessMember.findOne({ businessId, userId: req.user._id, isArchived: false })
  → Not found → 403
  → Found → req.workspace = { membershipId, businessId, role }
```

Every downstream DB query includes `businessId` from `req.workspace`. Cross-tenant data access is not possible through the API layer.

### Role Model

```
OWNER    → full control including member management
ADMIN    → all operations except destroying the business
EMPLOYEE → read/write operations; cannot manage members or roles
```

`requireRole` is a composable factory:

```typescript
export const requireRole = (roles: BusinessRole | BusinessRole[]) =>
  asyncHandler(async (req, _, next) => {
    const allowed = Array.isArray(roles) ? roles : [roles];
    if (!allowed.includes(req.workspace!.role)) throw new ApiError(403, "Forbidden");
    next();
  });
```

## Key Service Patterns

### Atomic Invoice Number Generation

`InvoiceCounter` collection with compound unique index `{ businessId, year }`:

```typescript
const counter = await InvoiceCounter.findOneAndUpdate(
  { businessId, year },
  { $inc: { sequence: 1 } },
  { new: true, upsert: true }
).session(session);

const invoiceNumber = `INV-${year}-${String(counter.sequence).padStart(4, "0")}`;
```

Counter increment and `Invoice.create` happen in the same MongoDB session — both commit or both roll back.

### Price Snapshotting

```typescript
const invoiceItems = mergedItems.map(item => ({
  productId: product._id,       // traceability only — never used for pricing
  name:      product.name,      // snapshot
  price:     product.price,     // snapshot
  total:     product.price * item.quantity,  // snapshot
}));
```

Product price changes after creation have no effect on historical records.

### Atomic Payment + Invoice Closure

```typescript
const session = await startSession();
session.startTransaction();
try {
  if (amount >= invoice.total) {
    invoice.status = INVOICE_STATUS.PAID;
    await invoice.save({ session });
  }
  [payment] = await Payment.create([{ ... }], { session });
  await session.commitTransaction();
} catch (e) {
  await session.abortTransaction();
  throw e;
} finally {
  await session.endSession();
}
```

### Aggregation Pipeline Search

Invoice search by client name/email uses `$lookup` + post-join `$match`:

```typescript
Invoice.aggregate([
  { $match: { businessId, isArchived: false } },
  { $lookup: { from: "clients", localField: "client", foreignField: "_id", as: "client" } },
  { $addFields: { client: { $arrayElemAt: ["$client", 0] } } },
  { $match: { "client.email": { $regex: email, $options: "i" } } },
  { $sort: { [sortBy]: sortOrder } },
])
```

## Shared Utilities

| Utility | Purpose |
|---------|---------|
| `ApiError` | Structured error: `statusCode`, `message`, `errors[]` |
| `ApiResponse` | Uniform success envelope: `{ statusCode, data, message, success }` |
| `asyncHandler` | Wraps async handlers; forwards rejected promises to `next(err)` |
| `errorHandler` | Global Express error handler; handles `ZodError`, `ApiError`, and unknown errors |

## Constants

`src/consts.ts` is the canonical source for all enums:

```
BUSINESS_ROLE    → OWNER | ADMIN | EMPLOYEE
PRODUCT_TYPE     → PRODUCT | SERVICE
INVOICE_STATUS   → DRAFT | SENT | PAID | OVERDUE | CANCELLED
PAYMENT_METHOD   → CASH | UPI | BANK | CARD
PAYMENT_STATUS   → SUCCESS | PENDING | FAILED
```

## Known Issues

| Issue | Impact |
|-------|--------|
| `helmet` imported after first use in `app.ts` | Works at runtime due to hoisting but misleading |
| Product image update route not implemented | `removeOnCloudinary` is wired for avatar and logo only; product image replacement is out of scope for the current API |
| `generateInvoicePdf` uses `process.cwd()` for template path | Breaks if server is not started from project root |
| No integration tests | Cannot verify transactional correctness automatically |
