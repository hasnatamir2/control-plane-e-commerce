# 🎓 Examiner Setup Guide

## Quick Start (2 Minutes)

This application uses **Prisma Cloud PostgreSQL** - no local database setup required!

### Prerequisites

- Docker Desktop installed and running
- Node.js 18+ installed
- Git installed

### Step 1: Clone & Setup

```bash
# Clone the repository
git clone <repository-url>
cd ecommerce-platform

# Copy environment variables
cp .env.example .env

# Edit .env and add your Prisma Cloud DATABASE_URL
# Get it from: https://cloud.prisma.io/projects
nano .env  # or use your preferred editor
```

**Important:** Update the `DATABASE_URL` in `.env` with your Prisma Cloud connection string:

```env
DATABASE_URL="postgresql://username:password@host:5432/database?schema=public&sslmode=require"
```

### Step 2: Run Database Migrations

```bash
# Install dependencies
npm install

# Generate Prisma Client
npx prisma generate

# Run migrations (creates tables in Prisma Cloud)
npx prisma migrate deploy

# Or for development with migration history
npx prisma migrate dev
```

### Step 3: Start with Docker (Recommended)

```bash
# Start all services (Mock API + Redis + Main App)
docker compose up -d

# Wait ~30 seconds for services to be ready
docker compose ps

# Check health
curl http://localhost:3000/health
curl http://localhost:3001/health
```

**That's it!** The application is running on:

- **Main API:** http://localhost:3000
- **Mock API:** http://localhost:3001
- **Admin Panel UI:** http://localhost:3002

---

## Documentation:

- [README.md](README.md) - Project overview
- [EXAMINER_GUIDE.md](EXAMINER_GUIDE.md) - Setup instructions
- [API_DOCUMENTATION.md](API_DOCUMENTATION.md) - Complete API reference

---
## 📋 What to Review

### 1. Architecture

```
src/
├── domain/               # Business entities, value objects, domain services
│   ├── entities/         # CreditBalance, Purchase, Refund, CreditTransaction
│   ├── value-objects/    # Money, CustomerId, ProductId
│   ├── services/         # CreditDomainService, PurchaseDomainService
│   └── repositories/     # Repository interfaces (abstractions)
│
├── application/          # Use cases and DTOs
│   ├── use-cases/        # Business logic orchestration
│   ├── dtos/             # Data transfer objects
│   └── services/         # Mappers (Domain → DTO)
│
├── infrastructure/       # External concerns
│   ├── database/         # Prisma repositories
│   ├── container/        # Dependency Injection
│   └── external-apis/    # Customer, Product, Shipment API clients
│
└── presentation/         # HTTP layer
│   ├── http/
│   │   ├── controllers/  # Request handlers
│   │   ├── routes/       # Route definitions
│   │   ├── middlewares/  # Middleware definitions
│   │   └── validators/   # Zod schemas
│   ├── shared/           # Shared utilities
│   │   ├── errors/
│   │   ├── types/
│   │   └── utils/
│   └── tests/
│       ├── unit/
│       ├── integration/
│       └── e2e/
├── mock-api/             # External API mocks
├── admin-panel/          # Admin Panel React App UI
├── prisma/               # Database schema & migrations
└── docker-compose.yml
```

### 2. Key Features Implemented

✅ **Credit Management**

- Grant credit with audit trail
- Deduct credit with balance checks
- Get balance (auto-creates if doesn't exist)
- Transaction history with pagination

✅ **Purchase Flow**

- Fetch customer from external API
- Fetch product from external API
- Check credit balance
- Deduct credit in transaction
- Create shipment via external API
- **Automatic rollback** if shipment fails
- Store product/customer snapshots

✅ **Refund System**

- Full or partial refunds
- Credit returned to customer
- Status tracking (COMPLETED → PARTIALLY_REFUNDED → FULLY_REFUNDED)
- Refund history

✅ **Promo Code Discount**

- Create Promo codes
- Discount for Promo code
- Validation, Use count and Usage stats

✅ **Data Integrity**

- Optimistic locking (prevents race conditions)
- Database transactions
- Complete audit trail
- Historical snapshots

## 🏗️ Architecture Patterns

### Clean Architecture + DDD

- **Domain Layer:** Pure business logic, no dependencies
- **Application Layer:** Use cases orchestrate domain logic
- **Infrastructure Layer:** Database, external APIs, caching
- **Presentation Layer:** HTTP controllers, routes, validation

### Domain-Driven Design

- **Entities:** CreditBalance, Purchase, Refund, PromoCode
- **Value Objects:** Money, CustomerId, ProductId
- **Domain Services:** Complex business logic
- **Repositories:** Data access abstraction

### Design Patterns

- **Repository Pattern:** Abstract data access
- **Dependency Injection:** Testable, decoupled code
- **DTO Pattern:** Clean layer boundaries
- **Mapper Pattern:** Domain ↔ DTO conversion
- **Domain Services:** Stateless business logic
- **Optimistic Locking:** Concurrency control

---

## 📊 Database Schema

### Tables

1. **credit_balances** - Current balance per customer
2. **credit_transactions** - Immutable audit trail
3. **purchases** - Purchase records with snapshots
4. **refunds** - Refund history
5. **promo_code** - Promo code discounts
6. **promo_code_usage** - Promo code record and analytics

### Key Features

- Optimistic locking (version field)
- JSON snapshots (product/customer data)
- Proper indexes
- Foreign key constraints

---

## 🎯 Requirements Checklist

- [x] Grant/deduct credit balance
- [x] Get customer's credit balance
- [x] Purchase a product
  - [x] Calls external Customer API
  - [x] Calls external Product API
  - [x] Calls external Shipment API
  - [x] Rollback on shipment failure
- [x] List product purchases
- [x] Refund a purchase (full or partial)

**Bonus Features:**


- [x] Modern React admin panel with ClickHouse Click UI
- [x] Promo Code discount system
- [x] Promo Code usage
- [x] Complete audit trail (credit transactions)
- [x] Historical record keeping (snapshots)
- [x] Optimistic locking (concurrency control)
- [x] Domain services (business logic)
- [x] Clean architecture + DDD
- [x] Comprehensive error handling
- [x] Request validation (Zod)
- [x] Docker deployment

---

## 🔍 Code Quality

### Testing

```bash
# Run unit tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test
npm test -- CreditRepository
```

### Linting

```bash
# Run ESLint
npm run lint

# Fix auto-fixable issues
npm run lint:fix
```

### Type Checking

```bash
# Run TypeScript compiler
npm run type-check
```

---

## 🚀 Deployment

### Docker (Production)

```bash
# Build and run all services
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop services
docker-compose down
```

### Manual Build

```bash
# Build
npm run build

# Run migrations
npx prisma migrate deploy

# Start
npm start
```

---

## 📝 API Documentation

See `API_DOCUMENTATION.md` for complete endpoint reference with:

- Request/response examples
- Error codes
- cURL examples
- Postman collection

---

## 🆘 Troubleshooting

### "Connection refused" errors

```bash
# Check Docker is running
docker compose ps

# Check logs
docker compose logs app
docker compose logs mock-api

# Restart services
docker compose restart
```

### Database connection issues

```bash
# Verify DATABASE_URL in .env
# Make sure it includes &sslmode=require for Prisma Cloud
# Test connection
npx prisma db pull
```

### Port already in use

```bash
# Change ports in docker-compose.yml
# Or stop conflicting services
lsof -i :3000
lsof -i :3001
lsof -i :3002
```

---

## ✅ Verification Checklist

Before reviewing, verify:

- [ ] Docker Desktop is running
- [ ] `.env` has valid DATABASE_URL from Prisma Cloud
- [ ] `docker-compose up -d` completes successfully
- [ ] `curl http://localhost:3000/health` returns OK
- [ ] `curl http://localhost:3001/health` returns OK
- [ ] Can grant credit successfully
- [ ] Can create purchase successfully
- [ ] Can verify credit deduction
- [ ] Postman collection imports correctly

Thank you for reviewing! 🙏
