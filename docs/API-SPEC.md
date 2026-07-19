# KUBERA API Specification v1.0

> **Boilerplate Project — B2B Trade Finance Escrow Starter Kit**
> Stack: Next.js 16 (App Router) + FastAPI + PostgreSQL + Stripe Connect

---

## Table of Contents

1. [API Overview](#1-api-overview)
2. [Authentication](#2-authentication-endpoints)
3. [Contracts](#3-escrow-contract-endpoints)
4. [Milestones](#4-milestone-endpoints)
5. [Payments](#5-payment-endpoints)
6. [Transactions](#6-transaction-endpoints)
7. [Disputes](#7-dispute-endpoints)
8. [Webhooks](#8-stripe-webhook)
9. [Error Codes](#9-standard-error-response-format)
10. [Appendix: State Machine](#10-appendix)

---

## 1. API Overview

| Property | Value |
|---|---|
| **Base URL** | `http://localhost:8000/api/v1/` |
| **Content-Type** | `application/json` |
| **Auth Scheme** | Bearer JWT (`Authorization: Bearer <token>`) |
| **Rate Limit** | 100 req/min per IP, 1000 req/hr per authenticated user |

### Headers

```
Accept: application/json
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

### Pagination

All list endpoints accept `page` (default 1) and `limit` (default 20, max 100). Responses include:

```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total_items": 142,
    "total_pages": 8
  }
}
```

### Dates

All timestamps are ISO 8601 in UTC: `"2026-07-19T14:30:00Z"`

---

## 2. Authentication Endpoints

**Prefix:** `/api/v1/auth`

---

### `POST /register`

Create a new user account.

**Auth:** None

**Request Body:**

```json
{
  "email": "vendor@example.com",
  "password": "SecurePass123!",
  "name": "Acme Exports Ltd"
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `email` | string | yes | Valid email, max 255 chars |
| `password` | string | yes | Min 8 chars, 1 uppercase, 1 number |
| `name` | string | yes | Min 2, max 100 chars |

**Response `201`:**

```json
{
  "user": {
    "id": "usr_2kf8a9d1",
    "email": "vendor@example.com",
    "name": "Acme Exports Ltd",
    "role": "buyer",
    "kyc_status": "unverified",
    "created_at": "2026-07-19T14:30:00Z"
  },
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
  "expires_in": 3600
}
```

**Status Codes:**
| Code | Description |
|---|---|
| 201 | User created |
| 400 | Validation error (weak password, invalid email, missing field) |
| 409 | Email already registered |

**Curl:**
```bash
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"vendor@example.com","password":"SecurePass123!","name":"Acme Exports Ltd"}'
```

---

### `POST /login`

Authenticate with email and password.

**Auth:** None

**Request Body:**

```json
{
  "email": "vendor@example.com",
  "password": "SecurePass123!"
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `email` | string | yes | Registered email |
| `password` | string | yes | Account password |

**Response `200`:**

```json
{
  "user": {
    "id": "usr_2kf8a9d1",
    "email": "vendor@example.com",
    "name": "Acme Exports Ltd",
    "role": "buyer",
    "kyc_status": "verified",
    "created_at": "2026-07-19T14:30:00Z"
  },
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
  "expires_in": 3600
}
```

**Status Codes:**
| Code | Description |
|---|---|
| 200 | Authenticated |
| 400 | Missing credentials |
| 401 | Invalid email or password |

**Curl:**
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"vendor@example.com","password":"SecurePass123!"}'
```

---

### `POST /refresh`

Exchange a refresh token for a new access token.

**Auth:** None (uses refresh token in body)

**Request Body:**

```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIs..."
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `refresh_token` | string | yes | Valid refresh token |

**Response `200`:**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
  "expires_in": 3600
}
```

**Status Codes:**
| Code | Description |
|---|---|
| 200 | Tokens refreshed |
| 401 | Invalid or expired refresh token |

**Curl:**
```bash
curl -X POST http://localhost:8000/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refresh_token":"eyJhbGciOiJIUzI1NiIs..."}'
```

---

### `GET /me`

Return the authenticated user's profile.

**Auth:** Bearer token

**Response `200`:**

```json
{
  "id": "usr_2kf8a9d1",
  "email": "vendor@example.com",
  "name": "Acme Exports Ltd",
  "role": "buyer",
  "kyc_status": "verified",
  "stripe_account_id": "acct_1J...",
  "avatar_url": null,
  "created_at": "2026-07-19T14:30:00Z",
  "updated_at": "2026-07-19T15:00:00Z"
}
```

**Status Codes:**
| Code | Description |
|---|---|
| 200 | Profile returned |
| 401 | Missing or invalid token |

**Curl:**
```bash
curl http://localhost:8000/api/v1/auth/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

---

### `GET /oauth/{provider}`

Initiate OAuth login with an external provider.

**Auth:** None

**Path Parameters:**

| Param | Type | Values |
|---|---|---|
| `provider` | string | `google` |

**Query Parameters:**

| Param | Type | Required | Description |
|---|---|---|---|
| `redirect_uri` | string | no | Custom callback URI (defaults to config) |

**Response `302`:** Redirects to provider's consent page.

**Response `200` (when `?format=link`):**

```json
{
  "authorization_url": "https://accounts.google.com/o/oauth2/auth?..."
}
```

**Status Codes:**
| Code | Description |
|---|---|
| 302 | Browser redirect |
| 200 | URL returned for programmatic use |
| 400 | Unsupported provider |

**Curl:**
```bash
curl http://localhost:8000/api/v1/auth/oauth/google?format=link
```

---

### `GET /oauth/{provider}/callback`

Handle the OAuth callback from the provider.

**Auth:** None

**Query Parameters:**

| Param | Type | Required |
|---|---|---|
| `code` | string | yes |
| `state` | string | yes |

**Response `200`:**

```json
{
  "user": {
    "id": "usr_2kf8a9d1",
    "email": "vendor@gmail.com",
    "name": "Acme Exports Ltd",
    "role": "buyer",
    "kyc_status": "unverified"
  },
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
  "is_new_user": false
}
```

**Status Codes:**
| Code | Description |
|---|---|
| 200 | Authenticated (login or register) |
| 400 | Invalid code or state mismatch |
| 401 | Provider rejected authorization |

---

## 3. Escrow Contract Endpoints

**Prefix:** `/api/v1/contracts`

---

### `POST /`

Create a new escrow contract.

**Auth:** Bearer token

**Request Body:**

```json
{
  "title": "Smartphone Component Supply — Q3 2026",
  "description": "Escrow agreement for 10,000 display panels between Acme Exports and TechCorp Sourcing.",
  "buyer_id": "usr_2kf8a9d1",
  "seller_id": "usr_3a7b2c5e",
  "amount": 250000.00,
  "currency": "usd",
  "milestones": [
    {
      "title": "Design Approval",
      "description": "Final PCB design sign-off",
      "percentage": 20,
      "due_date": "2026-08-15T00:00:00Z"
    },
    {
      "title": "Prototype Delivery",
      "description": "First 100 units for QA testing",
      "percentage": 30,
      "due_date": "2026-09-01T00:00:00Z"
    },
    {
      "title": "Final Delivery",
      "description": "Full 10,000 units shipped FOB Shenzhen",
      "percentage": 50,
      "due_date": "2026-10-01T00:00:00Z"
    }
  ]
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `title` | string | yes | 3–200 chars |
| `description` | string | no | Max 2000 chars |
| `buyer_id` | string | yes | Valid user ID who is the buyer |
| `seller_id` | string | yes | Valid user ID who is the seller |
| `amount` | number | yes | Positive number, max 2 decimal places |
| `currency` | string | no | ISO 4217, defaults to `usd` |
| `milestones` | array | no | At least 1 item if provided |

Each milestone object:

| Field | Type | Required | Description |
|---|---|---|---|
| `title` | string | yes | 3–100 chars |
| `description` | string | no | Max 1000 chars |
| `percentage` | number | yes | Integer 1–100, sum across milestones must equal 100 |
| `due_date` | string | yes | ISO 8601 date in the future |

**Response `201`:**

```json
{
  "id": "ctr_7f8g3h2j",
  "title": "Smartphone Component Supply — Q3 2026",
  "description": "Escrow agreement for 10,000 display panels between Acme Exports and TechCorp Sourcing.",
  "buyer": {
    "id": "usr_2kf8a9d1",
    "name": "Acme Exports Ltd"
  },
  "seller": {
    "id": "usr_3a7b2c5e",
    "name": "TechCorp Sourcing Inc"
  },
  "amount": 250000.00,
  "currency": "usd",
  "status": "draft",
  "milestones": [
    {
      "id": "ms_1a2b3c4d",
      "title": "Design Approval",
      "percentage": 20,
      "status": "pending",
      "due_date": "2026-08-15T00:00:00Z"
    },
    {
      "id": "ms_5e6f7g8h",
      "title": "Prototype Delivery",
      "percentage": 30,
      "status": "pending",
      "due_date": "2026-09-01T00:00:00Z"
    },
    {
      "id": "ms_9i0j1k2l",
      "title": "Final Delivery",
      "percentage": 50,
      "status": "pending",
      "due_date": "2026-10-01T00:00:00Z"
    }
  ],
  "created_at": "2026-07-19T14:30:00Z",
  "updated_at": "2026-07-19T14:30:00Z"
}
```

**Status Codes:**
| Code | Description |
|---|---|
| 201 | Contract created |
| 400 | Validation error (milestone sum ≠ 100, past due_date, invalid currency) |
| 401 | Unauthenticated |
| 403 | User not authorized to create contracts for these parties |

**Curl:**
```bash
curl -X POST http://localhost:8000/api/v1/contracts \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "Content-Type: application/json" \
  -d '{"title":"Smartphone Component Supply","buyer_id":"usr_2kf8a9d1","seller_id":"usr_3a7b2c5e","amount":250000,"milestones":[{"title":"Design Approval","percentage":20,"due_date":"2026-08-15T00:00:00Z"},{"title":"Final Delivery","percentage":80,"due_date":"2026-10-01T00:00:00Z"}]}'
```

---

### `GET /`

List contracts accessible to the authenticated user.

**Auth:** Bearer token

**Query Parameters:**

| Param | Type | Default | Description |
|---|---|---|---|
| `status` | string | — | Filter: `draft`, `funded`, `active`, `completed`, `cancelled`, `disputed` |
| `role` | string | — | Filter: `buyer`, `seller` |
| `page` | integer | 1 | Page number |
| `limit` | integer | 20 | Items per page (max 100) |
| `search` | string | — | Full-text search on title |
| `sort_by` | string | `created_at` | `created_at`, `amount`, `status` |
| `sort_order` | string | `desc` | `asc`, `desc` |

**Response `200`:**

```json
{
  "data": [
    {
      "id": "ctr_7f8g3h2j",
      "title": "Smartphone Component Supply — Q3 2026",
      "buyer": { "id": "usr_2kf8a9d1", "name": "Acme Exports Ltd" },
      "seller": { "id": "usr_3a7b2c5e", "name": "TechCorp Sourcing Inc" },
      "amount": 250000.00,
      "currency": "usd",
      "status": "funded",
      "funded_amount": 250000.00,
      "milestone_progress": "2/5 completed",
      "created_at": "2026-07-19T14:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total_items": 1,
    "total_pages": 1
  }
}
```

**Status Codes:**
| Code | Description |
|---|---|
| 200 | Contracts returned |
| 401 | Unauthenticated |

---

### `GET /{id}`

Get a single contract with full details.

**Auth:** Bearer token (must be buyer or seller on the contract)

**Path Parameters:**

| Param | Type | Description |
|---|---|---|
| `id` | string | Contract ID (e.g., `ctr_7f8g3h2j`) |

**Response `200`:**

```json
{
  "id": "ctr_7f8g3h2j",
  "title": "Smartphone Component Supply — Q3 2026",
  "description": "Escrow agreement for 10,000 display panels.",
  "buyer": {
    "id": "usr_2kf8a9d1",
    "name": "Acme Exports Ltd",
    "email": "vendor@example.com"
  },
  "seller": {
    "id": "usr_3a7b2c5e",
    "name": "TechCorp Sourcing Inc",
    "email": "sourcing@techcorp.com"
  },
  "amount": 250000.00,
  "currency": "usd",
  "funded_amount": 250000.00,
  "platform_fee": 6250.00,
  "status": "funded",
  "milestones": [
    {
      "id": "ms_1a2b3c4d",
      "title": "Design Approval",
      "percentage": 20,
      "amount": 50000.00,
      "status": "pending",
      "due_date": "2026-08-15T00:00:00Z",
      "completed_at": null,
      "proof_documents": []
    }
  ],
  "recent_transactions": [
    {
      "id": "txn_9x8y7z6w",
      "type": "fund",
      "amount": 250000.00,
      "status": "succeeded",
      "created_at": "2026-07-19T15:00:00Z"
    }
  ],
  "created_at": "2026-07-19T14:30:00Z",
  "updated_at": "2026-07-19T15:00:00Z"
}
```

**Status Codes:**
| Code | Description |
|---|---|
| 200 | Contract returned |
| 401 | Unauthenticated |
| 403 | User not party to the contract |
| 404 | Contract not found |

---

### `PATCH /{id}`

Update a draft contract. Only editable in `draft` state.

**Auth:** Bearer token (must be buyer)

**Request Body:**

```json
{
  "title": "Updated: Smartphone Component Supply — Q4 2026",
  "description": "Updated description.",
  "milestones": [
    {
      "title": "Design Approval",
      "percentage": 10,
      "due_date": "2026-09-01T00:00:00Z"
    },
    {
      "title": "Final Delivery",
      "percentage": 90,
      "due_date": "2026-11-01T00:00:00Z"
    }
  ]
}
```

All fields optional — only provided fields are updated.

**Response `200`:** Full contract object (same schema as `GET /{id}`).

**Status Codes:**
| Code | Description |
|---|---|
| 200 | Updated |
| 400 | Validation error, or milestone sum ≠ 100 |
| 401 | Unauthenticated |
| 403 | Only buyer can edit; or contract not in draft |
| 404 | Contract not found |
| 409 | Contract is not in draft state |

---

### `DELETE /{id}`

Delete a contract. Only possible in `draft` state.

**Auth:** Bearer token (must be buyer)

**Path Parameters:**

| Param | Type |
|---|---|
| `id` | string |

**Response `204`:** No content.

**Status Codes:**
| Code | Description |
|---|---|
| 204 | Deleted |
| 401 | Unauthenticated |
| 403 | Not the buyer |
| 404 | Contract not found |
| 409 | Contract not in draft state |

---

### `POST /{id}/cancel`

Cancel a funded contract. Triggers full refund to buyer (minus any released milestone amounts).

**Auth:** Bearer token (buyer or seller; both must consent — second call finalizes)

**Request Body:**

```json
{
  "reason": "Mutual agreement — supplier cannot meet timeline."
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `reason` | string | yes | Min 10 chars |

**Response `200`:**

```json
{
  "id": "ctr_7f8g3h2j",
  "status": "cancelled",
  "cancelled_at": "2026-07-20T10:00:00Z",
  "refund_status": "pending",
  "refund_amount": 200000.00,
  "reason": "Mutual agreement — supplier cannot meet timeline."
}
```

**Status Codes:**
| Code | Description |
|---|---|
| 200 | Cancel initiated or completed |
| 400 | Missing reason |
| 401 | Unauthenticated |
| 403 | Not a party to the contract |
| 404 | Contract not found |
| 409 | Contract not in `funded` or `active` state |

---

## 4. Milestone Endpoints

**Prefix:** `/api/v1/contracts/{contract_id}/milestones`

---

### `POST /`

Add a milestone to an existing contract. Only in `draft` state.

**Auth:** Bearer token (buyer)

**Request Body:**

```json
{
  "title": "Packaging & Labeling Approval",
  "description": "Final packaging artwork sign-off",
  "percentage": 10,
  "due_date": "2026-08-30T00:00:00Z"
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `title` | string | yes | 3–100 chars |
| `description` | string | no | Max 1000 chars |
| `percentage` | number | yes | 1–100; sum across all milestones must remain ≤ 100 |
| `due_date` | string | yes | ISO 8601, must be in the future |

**Response `201`:**

```json
{
  "id": "ms_3m4n5p6q",
  "contract_id": "ctr_7f8g3h2j",
  "title": "Packaging & Labeling Approval",
  "description": "Final packaging artwork sign-off",
  "percentage": 10,
  "amount": 25000.00,
  "status": "pending",
  "due_date": "2026-08-30T00:00:00Z",
  "completed_at": null,
  "proof_documents": [],
  "created_at": "2026-07-19T16:00:00Z"
}
```

**Status Codes:**
| Code | Description |
|---|---|
| 201 | Created |
| 400 | Validation error |
| 401 | Unauthenticated |
| 403 | Not the buyer |
| 404 | Contract not found |
| 409 | Contract not in draft |

---

### `PATCH /{milestone_id}`

Update milestone details. Only in `pending` status.

**Auth:** Bearer token (buyer)

**Request Body:** Same fields as POST, all optional.

**Response `200`:** Updated milestone object.

**Status Codes:**
| Code | Description |
|---|---|
| 200 | Updated |
| 400 | Validation error |
| 401 | Unauthenticated |
| 403 | Not the buyer |
| 404 | Milestone not found |
| 409 | Milestone not pending |

---

### `POST /{milestone_id}/complete`

Mark a milestone as complete. Seller attaches proof documents.

**Auth:** Bearer token (seller)

**Request Body:**

```json
{
  "notes": "Prototype units shipped via DHL tracking #1234567890.",
  "proof_documents": [
    {
      "filename": "packing_slip_q3.pdf",
      "content_type": "application/pdf",
      "data": "JVBERi0xLjQKMSAwIG9iag..."
    }
  ]
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `notes` | string | no | Max 2000 chars |
| `proof_documents` | array | yes | At least 1 document |
| `proof_documents[].filename` | string | yes | Max 255 chars |
| `proof_documents[].content_type` | string | yes | MIME type |
| `proof_documents[].data` | string | yes | Base64-encoded file (max 10 MB each) |

**Response `200`:**

```json
{
  "id": "ms_1a2b3c4d",
  "status": "awaiting_approval",
  "completed_at": null,
  "proof_documents": [
    {
      "id": "doc_7x8y9z0w",
      "filename": "packing_slip_q3.pdf",
      "content_type": "application/pdf",
      "url": "https://storage.kubera.dev/documents/ctr_7f8g3h2j/ms_1a2b3c4d/packing_slip_q3.pdf",
      "uploaded_at": "2026-07-20T09:00:00Z"
    }
  ],
  "completed_by": "usr_3a7b2c5e",
  "notes": "Prototype units shipped via DHL tracking #1234567890."
}
```

**Status Codes:**
| Code | Description |
|---|---|
| 200 | Marked as awaiting approval |
| 400 | Missing proof documents |
| 401 | Unauthenticated |
| 403 | Not the seller |
| 404 | Milestone not found |
| 409 | Milestone already completed or not pending |

---

### `POST /{milestone_id}/approve`

Approve a completed milestone and release payment to the seller's Stripe Connect account.

**Auth:** Bearer token (buyer)

**Request Body:**

```json
{
  "notes": "Looks good. Payment released."
}
```

| Field | Type | Required |
|---|---|---|
| `notes` | string | no |

**Response `200`:**

```json
{
  "id": "ms_1a2b3c4d",
  "status": "approved",
  "amount_released": 50000.00,
  "completed_at": "2026-07-21T14:00:00Z",
  "transaction_id": "txn_4r5t6y7u",
  "stripe_transfer_id": "tr_1J..."
}
```

**Status Codes:**
| Code | Description |
|---|---|
| 200 | Approved and payment released |
| 400 | Contract not fully funded |
| 401 | Unauthenticated |
| 403 | Not the buyer |
| 404 | Milestone not found |
| 409 | Milestone not in `awaiting_approval` state; insufficient contract balance |

---

## 5. Payment Endpoints

**Prefix:** `/api/v1/contracts/{contract_id}`

---

### `POST /fund`

Create a Stripe PaymentIntent to fund the escrow contract.

**Auth:** Bearer token (buyer)

**Request Body:** (empty or with optional metadata)

```json
{
  "payment_method_id": "pm_1J...",
  "save_payment_method": false
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `payment_method_id` | string | no | Stripe PM ID for immediate confirmation |
| `save_payment_method` | boolean | no | Save card for future use |

**Response `200` (requires confirmation):**

```json
{
  "client_secret": "pi_1J..._secret_...",
  "payment_intent_id": "pi_1J...",
  "amount": 25000000,
  "currency": "usd",
  "status": "requires_payment_method",
  "contract_id": "ctr_7f8g3h2j"
}
```

**Response `200` (confirmed immediately):**

```json
{
  "client_secret": null,
  "payment_intent_id": "pi_1J...",
  "amount": 25000000,
  "currency": "usd",
  "status": "succeeded",
  "contract_id": "ctr_7f8g3h2j",
  "transaction_id": "txn_9x8y7z6w"
}
```

> Amount is in **cents** (smallest currency unit). The platform fee (2.5%) is automatically calculated and visible only after funding.

**Status Codes:**
| Code | Description |
|---|---|
| 200 | PaymentIntent created/confirmed |
| 400 | Amount mismatch or invalid Stripe params |
| 401 | Unauthenticated |
| 403 | Only buyer can fund |
| 404 | Contract not found |
| 409 | Contract not in draft state or already funded |

**Curl:**
```bash
curl -X POST http://localhost:8000/api/v1/contracts/ctr_7f8g3h2j/fund \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "Content-Type: application/json"
```

---

### `GET /payment-status`

Check whether the contract has been fully funded.

**Auth:** Bearer token (buyer or seller)

**Response `200`:**

```json
{
  "contract_id": "ctr_7f8g3h2j",
  "amount_required": 250000.00,
  "amount_funded": 250000.00,
  "is_fully_funded": true,
  "funding_status": "completed",
  "payment_intents": [
    {
      "id": "pi_1J...",
      "amount": 25000000,
      "status": "succeeded",
      "created_at": "2026-07-19T15:00:00Z"
    }
  ]
}
```

**Status Codes:**
| Code | Description |
|---|---|
| 200 | Status returned |
| 401 | Unauthenticated |
| 403 | Not party to contract |
| 404 | Contract not found |

---

## 6. Transaction Endpoints

**Prefix:** `/api/v1/transactions`

---

### `GET /`

List all transactions for the authenticated user.

**Auth:** Bearer token

**Query Parameters:**

| Param | Type | Default | Description |
|---|---|---|---|
| `contract_id` | string | — | Filter by contract |
| `type` | string | — | `fund`, `release`, `refund`, `fee` |
| `status` | string | — | `pending`, `succeeded`, `failed` |
| `page` | integer | 1 | Page number |
| `limit` | integer | 20 | Items per page (max 100) |

**Response `200`:**

```json
{
  "data": [
    {
      "id": "txn_9x8y7z6w",
      "contract_id": "ctr_7f8g3h2j",
      "type": "fund",
      "amount": 250000.00,
      "currency": "usd",
      "status": "succeeded",
      "stripe_payment_intent_id": "pi_1J...",
      "stripe_transfer_id": null,
      "description": "Contract funding",
      "created_at": "2026-07-19T15:00:00Z"
    },
    {
      "id": "txn_4r5t6y7u",
      "contract_id": "ctr_7f8g3h2j",
      "type": "release",
      "amount": 50000.00,
      "currency": "usd",
      "status": "succeeded",
      "stripe_payment_intent_id": "pi_1J...",
      "stripe_transfer_id": "tr_1J...",
      "description": "Milestone release: Design Approval",
      "created_at": "2026-07-21T14:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total_items": 2,
    "total_pages": 1
  }
}
```

**Status Codes:**
| Code | Description |
|---|---|
| 200 | Transactions returned |
| 401 | Unauthenticated |

---

### `GET /{id}`

Get a single transaction.

**Auth:** Bearer token (must be party to the related contract)

**Response `200`:**

```json
{
  "id": "txn_9x8y7z6w",
  "contract_id": "ctr_7f8g3h2j",
  "type": "fund",
  "amount": 250000.00,
  "currency": "usd",
  "status": "succeeded",
  "stripe_payment_intent_id": "pi_1J...",
  "stripe_transfer_id": null,
  "fee_breakdown": {
    "platform_fee": 6250.00,
    "stripe_fee": 7200.00,
    "net_to_escrow": 236550.00
  },
  "description": "Contract funding",
  "created_at": "2026-07-19T15:00:00Z",
  "updated_at": "2026-07-19T15:01:00Z"
}
```

**Status Codes:**
| Code | Description |
|---|---|
| 200 | Transaction returned |
| 401 | Unauthenticated |
| 403 | Not a party to the related contract |
| 404 | Transaction not found |

---

## 7. Dispute Endpoints

**Prefix:** `/api/v1/contracts/{contract_id}/disputes`

---

### `POST /`

Raise a dispute on a contract. Only possible in `active` or `funded` state.

**Auth:** Bearer token (buyer or seller)

**Request Body:**

```json
{
  "reason": "delayed_delivery",
  "description": "The seller has missed the milestone due date by 14 days with no communication.",
  "evidence": [
    {
      "filename": "email_thread.pdf",
      "content_type": "application/pdf",
      "data": "JVBERi0xLjQK..."
    }
  ]
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `reason` | string | yes | One of: `delayed_delivery`, `defective_goods`, `breach_of_contract`, `fraud`, `other` |
| `description` | string | yes | Min 20, max 5000 chars |
| `evidence` | array | no | Up to 10 files, 10 MB each, base64 |

**Response `201`:**

```json
{
  "id": "dsp_5h6j7k8l",
  "contract_id": "ctr_7f8g3h2j",
  "raised_by": "usr_2kf8a9d1",
  "reason": "delayed_delivery",
  "description": "The seller has missed the milestone due date by 14 days with no communication.",
  "status": "open",
  "evidence": [
    {
      "id": "doc_2a3b4c5d",
      "filename": "email_thread.pdf",
      "url": "https://storage.kubera.dev/disputes/dsp_5h6j7k8l/email_thread.pdf",
      "uploaded_at": "2026-07-22T10:00:00Z"
    }
  ],
  "created_at": "2026-07-22T10:00:00Z",
  "updated_at": "2026-07-22T10:00:00Z"
}
```

**Status Codes:**
| Code | Description |
|---|---|
| 201 | Dispute raised |
| 400 | Validation error |
| 401 | Unauthenticated |
| 403 | Not party to contract |
| 404 | Contract not found |
| 409 | Contract not eligible (must be funded/active); dispute already exists |

---

### `GET /`

List disputes for a contract.

**Auth:** Bearer token (buyer, seller, or admin)

**Response `200`:**

```json
{
  "data": [
    {
      "id": "dsp_5h6j7k8l",
      "reason": "delayed_delivery",
      "status": "open",
      "raised_by": {
        "id": "usr_2kf8a9d1",
        "name": "Acme Exports Ltd"
      },
      "description": "The seller has missed the milestone due date...",
      "created_at": "2026-07-22T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total_items": 1,
    "total_pages": 1
  }
}
```

**Status Codes:**
| Code | Description |
|---|---|
| 200 | Disputes returned |
| 401 | Unauthenticated |
| 403 | Not party to contract |
| 404 | Contract not found |

---

### `PATCH /disputes/{dispute_id}`

Update dispute status. Admin-only endpoint.

**Auth:** Bearer token (requires `admin` role)

**Request Body:**

```json
{
  "status": "investigating",
  "admin_notes": "Reviewing evidence. Contacted both parties for additional documentation."
}
```

| Field | Type | Required | Valid values |
|---|---|---|---|
| `status` | string | yes | `investigating`, `resolved`, `rejected` |
| `admin_notes` | string | no | Max 5000 chars |

State transitions: `open` → `investigating` → `resolved` | `rejected`.

**Response `200`:**

```json
{
  "id": "dsp_5h6j7k8l",
  "contract_id": "ctr_7f8g3h2j",
  "status": "investigating",
  "admin_notes": "Reviewing evidence. Contacted both parties for additional documentation.",
  "resolved_at": null,
  "resolution": null,
  "updated_at": "2026-07-23T09:00:00Z"
}
```

**Status Codes:**
| Code | Description |
|---|---|
| 200 | Updated |
| 400 | Invalid state transition |
| 401 | Unauthenticated |
| 403 | Not an admin |
| 404 | Dispute not found |
| 409 | Dispute already resolved or rejected |

---

## 8. Stripe Webhook

**Prefix:** `/api/v1/webhooks`

---

### `POST /stripe`

Receives Stripe webhook events. Signature verified using the webhook secret.

**Auth:** None (signature verified via `Stripe-Signature` header)

**Headers:**

| Header | Description |
|---|---|
| `Stripe-Signature` | Stripe webhook signature (required) |

**Request Body:** Raw Stripe event JSON.

**Supported Events:**

| Event | Action |
|---|---|
| `payment_intent.succeeded` | Mark contract as funded, create transaction record |
| `payment_intent.payment_failed` | Log failure, notify buyer |
| `transfer.created` | Log transfer for milestone release |
| `charge.refunded` | Update contract and transaction records |

**Response `200`:**

```json
{
  "received": true
}
```

**Response `400`:**

```json
{
  "error": {
    "code": "WEBHOOK_SIGNATURE_INVALID",
    "message": "Stripe-Signature verification failed."
  }
}
```

**Status Codes:**
| Code | Description |
|---|---|
| 200 | Event processed |
| 400 | Invalid payload or signature |

---

## 9. Standard Error Response Format

All errors follow a consistent structure:

```json
{
  "error": {
    "code": "CONTRACT_NOT_FOUND",
    "message": "No contract with ID ctr_invalid.",
    "details": {
      "contract_id": "ctr_invalid"
    }
  }
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|---|---|---|
| `VALIDATION_ERROR` | 400 | Request body failed schema validation |
| `INVALID_STATE` | 409 | Operation not allowed in current contract/dispute state |
| `CONTRACT_NOT_FOUND` | 404 | Contract ID does not exist |
| `MILESTONE_NOT_FOUND` | 404 | Milestone ID does not exist |
| `TRANSACTION_NOT_FOUND` | 404 | Transaction ID does not exist |
| `DISPUTE_NOT_FOUND` | 404 | Dispute ID does not exist |
| `UNAUTHORIZED` | 401 | Missing or invalid JWT |
| `FORBIDDEN` | 403 | Authenticated but not authorized for this action |
| `EMAIL_EXISTS` | 409 | Email already registered |
| `INVALID_CREDENTIALS` | 401 | Wrong email or password |
| `TOKEN_EXPIRED` | 401 | JWT or refresh token expired |
| `MILESTONE_SUM_MUST_BE_100` | 400 | Milestone percentages must sum to 100 |
| `CONTRACT_NOT_DRAFT` | 409 | Contract must be in draft state |
| `CONTRACT_NOT_FUNDED` | 409 | Contract must be funded |
| `INSUFFICIENT_BALANCE` | 409 | Not enough escrow balance for this release |
| `DISPUTE_ALREADY_EXISTS` | 409 | An open dispute already exists for this contract |
| `INVALID_DISPUTE_TRANSITION` | 400 | Cannot transition from current dispute status to requested status |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

---

## 10. Appendix: Contract State Machine

```
                        +---------+
                        |  DRAFT  |
                        +----+----+
                             |
                      (buyer funds)
                             |
                        +----+----+
                        |  FUNDED |
                        +----+----+
                             |
                  (milestone completes)
                             |
                     +-------+-------+
                     |               |
              +------+------+  +-----+------+
              |   ACTIVE    |  | CANCELLED  |
              +------+------+  +------------+
                     |
          (all milestones approved)
                     |
              +------+------+
              |  COMPLETED  |
              +-------------+
```

Disputes can be raised from `FUNDED` or `ACTIVE` states, pausing milestone approvals until resolution.

---

*End of API-SPEC.md — KUBERA v1.0*
