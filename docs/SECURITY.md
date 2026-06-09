# Security

## Authentication

### JWT

- Access tokens: short-lived (default `1d`), configurable via `ACCESS_TOKEN_EXPIRY`
- Refresh tokens: long-lived (default `15d`), stored in the database and validated on each refresh
- Both tokens issued as **httpOnly cookies** — inaccessible to client-side JavaScript
- `Authorization: Bearer <token>` header also accepted for programmatic API access
- On logout, the refresh token is cleared from the database (`$unset: { refreshToken: 1 }`)
- JWT error messages are generic — no information disclosure about whether a user exists or a token is expired

### Password Storage

- Hashed with **bcrypt** (cost factor 10) via Mongoose pre-save hook
- Plain-text passwords are never stored or logged
- Google OAuth users have no `password` field — the login path checks for this explicitly and returns a clear error

### Password Reset

- Tokens generated with `crypto.randomBytes(32)` — 256 bits of entropy
- Only the **SHA-256 hash** is stored in the database; the raw token travels only in the reset email URL
- Tokens expire in **10 minutes**
- On use, `passwordResetToken` and `passwordResetTokenExpiry` are cleared atomically with the password update

### Google OAuth 2.0

- Implemented via `passport-google-oauth20`
- Only `profile` and `email` scopes requested
- Matched by `googleId` first, then `email` — prevents account hijacking for users who previously registered locally

---

## Authorization

### Role-Based Access Control

Three roles with decreasing privilege: `OWNER > ADMIN > EMPLOYEE`.

`requireRole` is a composable factory — role is resolved per-request from `BusinessMember`, not the JWT payload. Role changes take effect immediately without re-issuing tokens.

### Multi-Tenancy Isolation

Every business-scoped request validates `x-business-id` against `BusinessMember`:

```typescript
BusinessMember.findOne({ businessId, userId: req.user._id, isArchived: false })
```

A valid JWT without membership in the requested business receives `403`. All downstream queries include `businessId` from `req.workspace`. Cross-tenant data access is not possible through the API layer.

---

## Transport Security

- **Helmet** sets `X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`, and other security headers globally
- `strictTransportSecurity` (HSTS) enabled only in production (`NODE_ENV === "production"`)
- CORS configured with explicit `origin` from `CORS_ORIGIN` env var with `credentials: true`
- Rate limiting via `express-rate-limit` on all routes

---

## Input Validation

All inputs validated with **Zod 4** before reaching service functions. `ZodError` is caught by the global error handler and returns `400` with structured field-level errors:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [{ "field": "email", "message": "Invalid email address" }]
}
```

User-supplied strings used in MongoDB `$regex` queries are escaped with a dedicated `escapeRegex` helper to prevent ReDoS attacks.

---

## File Uploads

- Multer writes files to `public/temp/` temporarily; temp files are deleted after processing regardless of success or failure
- Filenames include a `Date.now()` prefix to prevent concurrent uploads from colliding in the temp directory
- Only the Cloudinary URL and `publicId` are stored in the database

---

## Data Integrity

- **Soft deletes** — `isArchived: true` across all collections; no data is permanently deleted
- **MongoDB transactions** — invoice number generation + document creation and payment recording + invoice closure both use sessions with commit/abort
- **Price snapshots** — invoice item totals are immutable after creation
- **Env validation** — all required environment variables are validated at startup via a Zod schema; the process exits immediately if any are missing

---

## Required Environment Variables

The following have no defaults and must be set:

```
MONGODB_URI              Replica set URI — transactions require a replica set
ACCESS_TOKEN_SECRET      JWT signing key for access tokens (min 32 chars)
REFRESH_TOKEN_SECRET     JWT signing key for refresh tokens (min 32 chars)
CLOUDINARY_CLOUD_NAME    
CLOUDINARY_API_KEY       
CLOUDINARY_API_SECRET    
RESEND_API_KEY           Transactional email
```

Optional:

```
PORT                     Default: 3000
CORS_ORIGIN              Default: *
ACCESS_TOKEN_EXPIRY      Default: 1d
REFRESH_TOKEN_EXPIRY     Default: 15d
GOOGLE_CLIENT_ID         
GOOGLE_CLIENT_SECRET     
GOOGLE_CALLBACK_URL      Default: http://localhost:3000/api/v1/auth/google/callback
```

See `.env.example` for the full template.
