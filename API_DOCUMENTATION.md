# Control Plane Backend API

This document describes every HTTP endpoint implemented by the Node.js backend in `src/presentation/http`. Use it as the single source of truth when building clients (admin panel, automation, tests) against the purchase-control plane.

## Testing Postman
- [**Postman Collection**](/control-plane-postman.json) is provided `/control-plane-postman.json`

## Base URL & Runtime
- **Local**: `http://localhost:3000`
- The server exposes `/health` directly at the root and scopes business routes under `/api/*`.
- Requests and responses are JSON (`Content-Type: application/json`). Send an `Accept: application/json` header to receive structured errors.
- Authentication/authorization is **not** implemented yet. Guard the service externally (API gateway, reverse proxy) before shipping to production.

## Common Conventions
- Every response uses the envelope `{ "success": boolean, "data"|"error": ... }`.
- All identifiers are UUID v4 strings. Validation rejects non-UUID input.
- Monetary fields (`amount`, `totalAmount`, `unitPrice`, etc.) are decimal numbers that represent USD.
- Dates are ISO-8601 strings when serialized (Express converts `Date` objects automatically).
- Zod validators enforce shapes. Invalid input raises `400` with `code: "VALIDATION_ERROR"`.

### Pagination
Some list endpoints accept `limit` and `offset` query parameters:
- `limit` must be a positive integer ≤ 100. Defaults to `50` when omitted.
- `offset` must be ≥ 0. Defaults to `0`.
- Responses echo `{ limit, offset }` and, for purchases, also include `total` and `totalPages`.

### Error Model
```
{
  "success": false,
  "error": {
    "message": "Human readable text",
    "code": "ValidationError | NotFoundError | InsufficientCreditError | DATABASE_ERROR | INTERNAL_ERROR | ...",
    "details": {} // Only present for validation errors (Zod issues)
  }
}
```
| Scenario | HTTP | `code` | Notes |
| --- | --- | --- | --- |
| Zod validation failure | 400 | `VALIDATION_ERROR` | Includes `details` with issue array. |
| Domain/application validation | 400 | `ValidationError` | Used for invalid DTOs, refund rules, etc. |
| Insufficient credit | 400 | `InsufficientCreditError` | Returned by credit deduction and purchase workflows. |
| Missing resource | 404 | `NotFoundError` | Purchases, promo codes, etc. |
| Database constraint | 400 | `DATABASE_ERROR` | Prisma known errors. |
| Unexpected failures | 500 | `INTERNAL_ERROR` | Message redacted in production.

### Domain Reference
| Concept | Values | Where used |
| --- | --- | --- |
| `PurchaseStatus` | `PENDING`, `COMPLETED`, `PARTIALLY_REFUNDED`, `FULLY_REFUNDED`, `CANCELLED` | Purchase records & filters. |
| `CreditTransactionType` | `GRANT`, `DEDUCT`, `REFUND` | Transaction history entries. |
| `PromoCodeStatus` | `ACTIVE`, `EXPIRED`, `DISABLED`, `USED_UP` | Promo code listing/filtering. |
| `PromoCodeType` | `PERCENTAGE`, `FIXED_AMOUNT` | Promo code creation validation. |

### Endpoint Catalog
| Domain | Method | Path | Description |
| --- | --- | --- | --- |
| Health | GET | `/health` | Liveness & database connectivity.
| Credits | POST | `/api/credits/grant` | Increase a customer's credit balance.
| Credits | POST | `/api/credits/deduct` | Decrease a customer's credit balance.
| Credits | GET | `/api/credits/balance/:customerId` | Fetch current balance snapshot.
| Credits | GET | `/api/credits/transactions/:customerId` | Paginated transaction history.
| Purchases | POST | `/api/purchases` | Create a purchase (fetches customer/product, creates shipment, deducts credit).
| Purchases | GET | `/api/purchases` | Paginated list with optional filters.
| Purchases | GET | `/api/purchases/customer/:customerId` | Alias for list scoped to one customer.
| Purchases | GET | `/api/purchases/:purchaseId` | Detailed purchase with refund history.
| Purchases | POST | `/api/purchases/:purchaseId/refund` | Full/partial refund, also credits balance.
| Promo Codes | POST | `/api/promo-code` | Create a promo code with lifecycle rules.
| Promo Codes | POST | `/api/promo-code/validate` | Check if a promo code can be applied to an order.
| Promo Codes | GET | `/api/promo-code` | Filterable list.
| Promo Codes | PATCH | `/api/promo-code/:id/disable` | Soft-disable a promo code.

---

## Endpoint Details

### Health
#### `GET /health`
Checks overall service status and database connectivity.
- **Response 200** when healthy, 503 when PostgreSQL is unreachable.
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2026-02-03T15:04:05.000Z",
    "database": "connected"
  }
}
```

### Credit Management
#### `POST /api/credits/grant`
Adds credit to a customer's balance and creates a `GRANT` transaction.
| Body field | Type | Required | Notes |
| --- | --- | --- | --- |
| `customerId` | string (UUID) | ✅ | Customer owning the wallet. |
| `amount` | number (> 0) | ✅ | USD amount to grant. |
| `reason` | string | ✅ | Audit text shown in transaction history. |
| `createdBy` | string | ❌ | Operator ID (admin user, system job, etc.). |
| `metadata` | object | ❌ | Arbitrary key/value pairs persisted with the transaction. |
- **Response 200** (`CreditOperationResultDto`):
```json
{
  "success": true,
  "data": {
    "customerId": "550e8400-e29b-41d4-a716-446655440001",
    "previousBalance": 250.0,
    "newBalance": 1250.0,
    "transactionId": "57cc9b1f-3891-4fef-97e8-2a8d4e144ad7",
    "timestamp": "2026-02-03T15:05:22.000Z"
  }
}
```

#### `POST /api/credits/deduct`
Removes credit from a customer's balance.
- Body schema mirrors the grant endpoint.
- Responds with the same envelope as grant.
- Raises `InsufficientCreditError (400)` when `amount` exceeds the available balance.

#### `GET /api/credits/balance/:customerId`
Returns the latest balance snapshot. Path parameter must be a UUID.
```json
{
  "success": true,
  "data": {
    "customerId": "550e8400-e29b-41d4-a716-446655440001",
    "currentBalance": 875.0,
    "lastUpdated": "2026-02-03T15:07:10.000Z"
  }
}
```

#### `GET /api/credits/transactions/:customerId`
Streams audit history for a wallet.
| Query | Type | Required | Notes |
| --- | --- | --- | --- |
| `limit` | number ≤ 100 | ❌ | Defaults to 50. |
| `offset` | number ≥ 0 | ❌ | Defaults to 0. |
```json
{
  "success": true,
  "data": {
    "customerId": "550e8400-e29b-41d4-a716-446655440001",
    "transactions": [
      {
        "id": "b5f8b9d1-6cec-43de-820c-948e62de3c02",
        "type": "DEDUCT",
        "amount": 349.99,
        "balanceBefore": 1225.0,
        "balanceAfter": 875.01,
        "reason": "Purchase of Professional Laptop",
        "relatedPurchaseId": "8b6413ab-8a79-4fcb-97a8-319bc2815d8d",
        "metadata": {
          "productId": "660e8400-e29b-41d4-a716-446655440001",
          "quantity": 1
        },
        "createdBy": "admin-123",
        "createdAt": "2026-02-03T15:04:50.000Z"
      }
    ],
    "pagination": { "limit": 50, "offset": 0 }
  }
}
```

### Purchase Management
All purchase routes orchestrate multiple systems: customer API, product API, shipment API, Prisma, and the credit service. Failures in downstream calls roll back the transaction, so you either get a fully-created purchase or an error.

#### `POST /api/purchases`
Creates a purchase, triggers shipment creation, and deducts credit in one transaction.
| Body field | Type | Required | Notes |
| --- | --- | --- | --- |
| `customerId` | string (UUID) | ✅ | Must exist in the external customer API. |
| `productId` | string (UUID) | ✅ | Must exist in the external product API. |
| `quantity` | integer (> 0) | ✅ | Used to calculate total amount. |
| `createdBy` | string | ❌ | Operator identifier stored on the purchase. |
- **Response 201** (`PurchaseDto`):
```json
{
  "success": true,
  "data": {
    "id": "c4e4e49a-0dd2-4714-9321-50c7ed918394",
    "customerId": "550e8400-e29b-41d4-a716-446655440001",
    "productId": "660e8400-e29b-41d4-a716-446655440001",
    "quantity": 2,
    "unitPrice": 1299.99,
    "totalAmount": 2599.98,
    "refundedAmount": 0,
    "remainingAmount": 2599.98,
    "status": "COMPLETED",
    "shipmentId": "SHIP-9c6e2ed0",
    "createdAt": "2026-02-03T15:12:00.000Z",
    "updatedAt": "2026-02-03T15:12:05.000Z"
  }
}
```
- Errors: `InsufficientCreditError (400)` if the wallet cannot cover the purchase; `ShipmentFailedError (500)` when the shipment adapter fails; `NotFoundError (404)` when customer/product is missing.

#### `GET /api/purchases`
Lists purchases with optional filters.
| Query | Type | Notes |
| --- | --- | --- |
| `customerId` | UUID | Filters to a single customer. |
| `status` | `PurchaseStatus` | Case-sensitive enum. |
| `limit` | number ≤ 100 | Defaults 50. |
| `offset` | number ≥ 0 | Defaults 0. |
- **Response 200** (`PurchaseListDto`):
```json
{
  "success": true,
  "data": {
    "purchases": [
      {
        "id": "c4e4e49a-0dd2-4714-9321-50c7ed918394",
        "customerId": "550e8400...0001",
        "productId": "660e8400...0001",
        "quantity": 2,
        "unitPrice": 1299.99,
        "totalAmount": 2599.98,
        "refundedAmount": 0,
        "remainingAmount": 2599.98,
        "status": "COMPLETED",
        "shipmentId": "SHIP-9c6e2ed0",
        "createdAt": "2026-02-03T15:12:00.000Z",
        "updatedAt": "2026-02-03T15:12:05.000Z"
      }
    ],
    "total": 1,
    "limit": 50,
    "offset": 0,
    "totalPages": 1
  }
}
```

#### `GET /api/purchases/customer/:customerId`
Convenience wrapper over `/api/purchases` with a required path param. Supports the same `limit` & `offset` query parameters and returns the identical payload structure as the list endpoint.

#### `GET /api/purchases/:purchaseId`
Returns a detailed purchase view plus refund records.
```json
{
  "success": true,
  "data": {
    "id": "c4e4e49a-0dd2-4714-9321-50c7ed918394",
    "customerId": "550e8400...0001",
    "productId": "660e8400...0001",
    "quantity": 2,
    "unitPrice": 1299.99,
    "totalAmount": 2599.98,
    "refundedAmount": 200,
    "remainingAmount": 2399.98,
    "status": "PARTIALLY_REFUNDED",
    "shipmentId": "SHIP-9c6e2ed0",
    "productSnapshot": {
      "id": "660e8400...0001",
      "sku": "LAPTOP-001",
      "name": "Professional Laptop",
      "description": "15\" workstation",
      "price": 1299.99
    },
    "customerSnapshot": {
      "id": "550e8400...0001",
      "name": "John Doe",
      "email": "john@example.com",
      "shippingAddress": {
        "line1": "123 Market St",
        "city": "San Francisco",
        "postalCode": "94103",
        "state": "CA",
        "country": "USA"
      }
    },
    "refunds": [
      {
        "id": "c77ef9e1-fd3d-4f34-9a67-cc644c44fbef",
        "purchaseId": "c4e4e49a-0dd2-4714-9321-50c7ed918394",
        "amount": 200,
        "reason": "Damaged box",
        "refundedBy": "agent-7",
        "createdAt": "2026-02-04T09:10:00.000Z"
      }
    ],
    "createdAt": "2026-02-03T15:12:00.000Z",
    "updatedAt": "2026-02-04T09:10:00.000Z"
  }
}
```
- Errors: `NotFoundError (404)` when the purchase or its refunds are missing.

#### `POST /api/purchases/:purchaseId/refund`
Processes partial or full refunds and credits the customer's wallet.
| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `purchaseId` | UUID (path) | ✅ | Purchase must be `COMPLETED` or `PARTIALLY_REFUNDED`. |
| `amount` | number (>0) | ✅ | Must not exceed remaining amount. |
| `reason` | string | ❌ | Stored with the refund & credit transaction. |
| `refundedBy` | string | ❌ | Operator identifier. |
- **Response 200** (`RefundResultDto`):
```json
{
  "success": true,
  "data": {
    "refundId": "c77ef9e1-fd3d-4f34-9a67-cc644c44fbef",
    "purchaseId": "c4e4e49a-0dd2-4714-9321-50c7ed918394",
    "amount": 200,
    "remainingAmount": 2399.98,
    "newStatus": "PARTIALLY_REFUNDED",
    "creditReturned": 200,
    "timestamp": "2026-02-04T09:10:00.000Z"
  }
}
```
- Errors: `ValidationError (400)` when amount exceeds the remaining balance; `NotFoundError (404)` when the purchase or its credit balance is missing.

### Promo Code Management
#### `POST /api/promo-code`
Creates a promo code with lifecycle rules.
| Body field | Type | Required | Notes |
| --- | --- | --- | --- |
| `code` | string | ✅ | Min 1 char; stored uppercased. Must be unique. |
| `type` | `PromoCodeType` | ✅ | `PERCENTAGE` (0-100) or `FIXED_AMOUNT` (>0). |
| `value` | number | ✅ | Discount percentage or amount. |
| `minPurchaseAmount` | number (>0) | ❌ | Minimum cart subtotal. |
| `maxDiscountAmount` | number (>0) | ❌ | Hard cap for `PERCENTAGE` codes. |
| `maxUsageCount` | integer (>0) | ❌ | Total allowed redemptions. |
| `validFrom` | ISO date | ✅ | Auto-parsed; must be < `validUntil`. |
| `validUntil` | ISO date | ✅ | Must be after `validFrom`. |
| `applicableProductIds` | string[] | ❌ | Leave empty to allow all products. |
- **Response 201** (`PromoCodeDto`): includes lifecycle metadata (`status`, `currentUsageCount`, timestamps).

#### `POST /api/promo-code/validate`
Determines whether a code can be applied to a purchase amount (and optional product).
| Body field | Type | Required |
| --- | --- | --- |
| `code` | string | ✅ |
| `purchaseAmount` | number (>0) | ✅ |
| `productId` | string | ❌ |
- **Response 200** (`PromoCodeValidationDto`):
```json
{
  "success": true,
  "data": {
    "valid": true,
    "code": "WELCOME10",
    "discountAmount": 25.0
  }
}
```
If invalid, `valid: false` and a human-friendly `message` explains why.

#### `GET /api/promo-code`
Returns all promo codes that match optional filters.
| Query | Type | Notes |
| --- | --- | --- |
| `status` | `PromoCodeStatus` | Filters by lifecycle status. |
| `type` | `PromoCodeType` | Filters discount type. |
| `isActive` | `'true' | 'false'` | Convenience filter for currently active codes. |
- **Response 200**: array of `PromoCodeDto` objects sorted by database default ordering.

#### `PATCH /api/promo-code/:id/disable`
Marks a promo code as `DISABLED` and returns the updated `PromoCodeDto` object. Throws `NotFoundError (404)` if the ID does not exist.

---

## Sample cURL Recipes
```bash
# Grant credit
curl -X POST http://localhost:3000/api/credits/grant \
  -H 'Content-Type: application/json' \
  -d '{
    "customerId": "550e8400-e29b-41d4-a716-446655440001",
    "amount": 1000,
    "reason": "Onboarding bonus",
    "createdBy": "admin-cli"
  }'

# Create a purchase
curl -X POST http://localhost:3000/api/purchases \
  -H 'Content-Type: application/json' \
  -d '{
    "customerId": "550e8400-e29b-41d4-a716-446655440001",
    "productId": "660e8400-e29b-41d4-a716-446655440001",
    "quantity": 1,
    "createdBy": "agent-9"
  }'

# Validate a promo code
curl -X POST http://localhost:3000/api/promo-code/validate \
  -H 'Content-Type: application/json' \
  -d '{
    "code": "WELCOME10",
    "purchaseAmount": 250,
    "productId": "660e8400-e29b-41d4-a716-446655440003"
  }'
```

## Operational Checklist
1. Run `npm run dev` (or `npm start` after `npm run build`).
2. Ensure PostgreSQL is reachable (`your Prisma Cloud connection string`).
3. Load mock external APIs in `mock-api/` when testing purchase flows.
4. Seed credits for a customer before attempting purchases or refunds.
