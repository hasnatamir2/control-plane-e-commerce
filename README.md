# E-Commerce Platform

A clean architecture e-commerce platform built with TypeScript, Node.js, PostgreSQL, and Prisma. This project implements a purchase flow management system with credit balance tracking, audit trails, and comprehensive testing.

## 🏗️ Architecture

This project follows **Clean Architecture** and **Domain-Driven Design (DDD)** principles with a clear separation of concerns:

- **Domain Layer**: Business logic, entities, value objects, and repository interfaces
- **Application Layer**: Use cases and DTOs
- **Infrastructure Layer**: Database repositories, external API clients, and caching
- **Presentation Layer**: HTTP controllers, routes, and middleware

## 🚀 Quick Start

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Docker and Docker Compose
- Git

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd control-plane-ecommerce-platform

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start Docker services
docker-compose up -d

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev --name init

# Start development server
npm run dev
```

The API will be available at `http://localhost:3000`

## 📦 Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Cache**: Redis (for bonus caching feature)
- **Testing**: Jest + Supertest
- **Validation**: Zod
- **Containerization**: Docker & Docker Compose

## 🎯 Features

### Core Features
- ✅ Credit balance management (grant/deduct)
- ✅ Get customer credit balance
- ✅ Purchase products with credit
- ✅ Shipment integration with rollback on failure
- ✅ List product purchases
- ✅ Refund purchases (full or partial)
- ✅ Comprehensive audit trail for all credit transactions
- ✅ Historical record keeping

### Bonus Features
- 🎁 Product and customer caching
- 🎁 React admin panel for customer service reps
- 🎁 E2E tests
- 🎁 Promo code support

## 📚 API Endpoints

### Credit Management
```
POST   /api/credits/grant              - Grant credit to customer
POST   /api/credits/deduct             - Deduct credit from customer
GET    /api/credits/balance/:customerId - Get customer's credit balance
GET    /api/credits/transactions/:customerId - Get credit transaction history
```

### Purchase Management
```
POST   /api/purchases                  - Create a new purchase
GET    /api/purchases                  - List all purchases
GET    /api/purchases/customer/:customerId - List customer's purchases
GET    /api/purchases/:id              - Get purchase details
POST   /api/purchases/:id/refund       - Refund a purchase
```

### Admin (Bonus)
```
GET    /api/admin/customers            - List all customers
GET    /api/admin/customers/:id/purchases - Get customer's purchase history
POST   /api/admin/customers/:id/credits - Manage customer credits
```

## 🗂️ Project Structure

```
control-plane-ecommerce-platform/
├── src/
│   ├── domain/                 # Business logic & entities
│   │   ├── entities/
│   │   ├── value-objects/
│   │   ├── repositories/
│   │   └── services/
│   ├── application/           # Use cases & DTOs
│   │   ├── use-cases/
│   │   └── dtos/
│   ├── infrastructure/        # External concerns
│   │   ├── database/
│   │   ├── external-apis/
│   │   └── cache/
│   ├── presentation/          # HTTP & UI
│   │   ├── http/
│   │   └── web/
│   ├── shared/               # Shared utilities
│   │   ├── errors/
│   │   ├── types/
│   │   └── utils/
│   └── tests/
│       ├── unit/
│       ├── integration/
│       └── e2e/
├── mock-api/                 # External API mocks
├── prisma/                   # Database schema & migrations
└── docker-compose.yml
```

## 🧪 Testing

### Test Data (Mock API)

**Customers:**
- John Doe: `550e8400-e29b-41d4-a716-446655440001`
- Jane Smith: `550e8400-e29b-41d4-a716-446655440002`

**Products:**
- Professional Laptop (SKU: LAPTOP-001): `660e8400-e29b-41d4-a716-446655440001` - $1,299.99
- Wireless Mouse (SKU: MOUSE-001): `660e8400-e29b-41d4-a716-446655440002` - $49.99
- Mechanical Keyboard (SKU: KEYBOARD-001): `660e8400-e29b-41d4-a716-446655440003` - $149.99

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e
```

## 🔧 Development

```bash
# Start development server with hot reload
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run database migrations
npm run prisma:migrate

# Open Prisma Studio (Database GUI)
npm run prisma:studio

# Lint code
npm run lint

# Format code
npm run format
```

## 🐳 Docker Commands

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f

# Rebuild containers
docker-compose up -d --build
```

## 📊 Database Schema

### Core Tables
- `credit_balances` - Current credit balance for each customer
- `credit_transactions` - Audit trail of all credit changes
- `purchases` - Purchase records with snapshots
- `refunds` - Refund history

## 🎨 Design Decisions

### Audit Trail
Every credit transaction is recorded with:
- Balance before/after
- Transaction type and reason
- Related purchase ID (if applicable)
- Timestamp and creator
- Additional metadata (JSON)

### Product/Customer Snapshots
Purchase records store snapshots of product and customer data at the time of purchase to maintain historical accuracy even if external data changes.

### Optimistic Locking
Credit balance updates use version-based optimistic locking to handle concurrent transactions safely.

### Transaction Rollback
Purchase operations are wrapped in database transactions. If shipment creation fails, the entire purchase is rolled back including credit deductions.

### External API Separation
Customer, Product, and Shipment APIs are treated as external services and accessed only through API calls, never directly from the persistence layer.

## 🚧 Future Improvements

- [ ] Authentication & Authorization (JWT)
- [ ] Rate limiting
- [ ] API documentation (Swagger/OpenAPI)
- [ ] Monitoring & logging (e.g., Winston, DataDog)
- [ ] Event sourcing for complete audit trail
- [ ] Message queue for async shipment processing
- [ ] Multi-currency support
- [ ] Inventory management
- [ ] Order status tracking

## 📝 Environment Variables

See `.env.example` for all available configuration options.

## 🤝 Contributing

This is a take-home project for ClickHouse. Follow the git commit strategy outlined in SETUP.md.

## 👤 Author

[Hasnat Amir](https://www.hasnatdev.com)