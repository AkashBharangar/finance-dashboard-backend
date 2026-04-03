# Finance Dashboard Backend

## Project Overview

This project is a backend service for a finance dashboard. It provides:

- User management with role-based access control
- Financial record creation and maintenance
- Server-side dashboard analytics for income, expenses, balance, category breakdowns, recent transactions, and monthly trends

The goal of the implementation is backend clarity rather than unnecessary complexity. The codebase is structured to keep responsibilities separated, business logic centralized, and access rules enforced consistently.

## Tech Stack

- **NestJS**
  Chosen for its modular architecture, guard system, and clean separation between controllers and services.
- **Prisma ORM**
  Used for schema management, type-safe database access, and a clean data access layer.
- **SQLite**
  Used for local development to keep setup lightweight and reproducible without requiring external infrastructure.
- **JWT Authentication**
  Used to authenticate requests and attach user identity to the request pipeline.
- **class-validator / class-transformer**
  Used for request validation and DTO transformation.

## Architecture Overview

The application is organized by domain modules so that each feature area has a clear boundary:

```text
src/
  common/
    decorators/
    enums/
    filters/
    guards/
    interfaces/
  modules/
    auth/
    user/
    finance/
    dashboard/
  prisma/
  app.module.ts
  main.ts
prisma/
  schema.prisma
  seed.ts
```

### Module Responsibilities

- **Auth module**
  Handles login and JWT strategy validation.
- **User module**
  Manages user creation, role updates, and activation/deactivation.
- **Finance module**
  Owns financial record CRUD, filtering, and pagination.
- **Dashboard module**
  Exposes analytics endpoints that aggregate finance data on the backend.

### Controllers vs Services

- **Controllers** are intentionally thin.
  They receive HTTP requests, validate DTOs, and delegate work.
- **Services** contain business logic.
  This keeps logic reusable, testable, and easier to evolve.

### Prisma as the Data Layer

Prisma is isolated behind `PrismaService`, which is injected into services. This keeps database access out of controllers and avoids leaking persistence concerns into routing code.

### Guards and Shared Access Logic

Authentication and authorization are enforced through reusable guards:

- `JwtAuthGuard`
  Ensures routes require authentication by default.
- `RolesGuard`
  Enforces role-based permissions via route metadata.
- `@Roles(...)`
  Declares allowed roles per route without hardcoding checks inside controllers.
- `@Public()`
  Explicitly opens routes such as login.

This design keeps RBAC centralized and avoids scattered permission logic.

## Role-Based Access Control

The system supports three roles:

- **ADMIN**
  Full access to users, financial records, and analytics.
- **ANALYST**
  Read access to financial records and dashboard insights.
- **VIEWER**
  Read-only access to dashboard summary data.

### Access Rules

- `ADMIN`
  Can create users, assign roles, activate/deactivate users, and create/update/delete financial records.
- `ANALYST`
  Can read financial records and dashboard analytics, but cannot mutate data.
- `VIEWER`
  Can access dashboard summary only.

### Enforcement Strategy

RBAC is applied at the guard layer, not inside route handlers:

- Global JWT guard authenticates requests
- Roles guard reads `@Roles(...)` metadata
- Controllers remain focused on transport concerns
- Services remain focused on business logic

This makes access control consistent and easy to audit.

## API Overview

### Auth

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| POST | `/api/auth/login` | Public | Authenticate a user and return a JWT |

### Users

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| POST | `/api/users` | ADMIN | Create a new user |
| GET | `/api/users` | ADMIN | List all users |
| PATCH | `/api/users/:id/role` | ADMIN | Change a user's role |
| PATCH | `/api/users/:id/status` | ADMIN | Activate or deactivate a user |

### Finance

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| POST | `/api/finance/records` | ADMIN | Create a financial record |
| GET | `/api/finance/records` | ANALYST, ADMIN | List financial records with filtering and pagination |
| PATCH | `/api/finance/records/:id` | ADMIN | Update a financial record |
| DELETE | `/api/finance/records/:id` | ADMIN | Delete a financial record |

Supported query parameters for `GET /api/finance/records`:

- `category`
- `type`
- `startDate`
- `endDate`
- `page`
- `limit`

### Dashboard

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| GET | `/api/dashboard/summary` | VIEWER, ANALYST, ADMIN | Return dashboard analytics |

The dashboard summary is computed on the backend and includes:

- `totalIncome`
- `totalExpense`
- `netBalance`
- `categoryBreakdown`
- `recentTransactions`
- `monthlyTrends`

## API Documentation Preview

### 1. Swagger Overview

![Swagger](./screenshots/swagger.png)

Full API documentation with all endpoints grouped by modules.

### 2. Authentication (Login)

![Login](./screenshots/login.png)

User authentication endpoint returning JWT token.

### 3. Financial Records API

![Finance](./screenshots/finance.png)

Paginated and filterable financial records API response.

## Database Design

The schema contains two core models:

### User

- `id`
- `email`
- `name`
- `passwordHash`
- `role`
- `isActive`
- `createdAt`
- `updatedAt`

### FinancialRecord

- `id`
- `amount`
- `type`
- `category`
- `date`
- `notes`
- `deletedAt`
- `createdAt`
- `updatedAt`

### Why Enums Are Handled at the App Layer

The application uses `Role` and `RecordType` enums in TypeScript for validation and authorization. In the SQLite schema, these are stored as strings.

This is a deliberate tradeoff:

- SQLite keeps local setup simple
- Prisma + SQLite has limitations around enum support compared to PostgreSQL
- App-level enums still provide clear role and type constraints in the service layer, DTOs, and guards

## Setup Instructions

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create a `.env` file in the project root:

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="change-me"
JWT_EXPIRES_IN="1d"
PORT=3000
```

### 3. Generate Prisma client

```bash
npm run prisma:generate
```

### 4. Push schema to the database

```bash
npm run prisma:push
```

### 5. Seed the database

```bash
npm run prisma:seed
```

### 6. Start the application

```bash
npm run start:dev
```

The API will be available at:

```text
http://localhost:3000/api
```

## Environment Variables

Refer to `.env.example` for required configuration.

## Seeded Users

The seed script creates three users for local testing:

| Role | Email | Password |
|---|---|---|
| ADMIN | `admin@finance.local` | `Admin@123` |
| ANALYST | `analyst@finance.local` | `Analyst@123` |
| VIEWER | `viewer@finance.local` | `Viewer@123` |

These credentials are for development only.

## Assumptions

- Authentication is intentionally simplified to email/password login with JWT access tokens
- Refresh tokens are not implemented
- All financial records belong to the same shared dashboard context rather than being partitioned by tenant or organization
- SQLite is used for local developer convenience
- Authorization is role-based only; there is no attribute-based access control

## Tradeoffs

### SQLite vs PostgreSQL

SQLite was chosen to reduce setup friction for local evaluation. This makes the project easier to run quickly, but it is not the best choice for production workloads that require concurrent writes, richer database features, or stronger operational guarantees.

### Simplicity vs Production Readiness

The implementation prioritizes clean architecture and correctness over production-grade completeness. For example:

- JWT auth is present, but refresh token rotation is omitted
- Validation and RBAC are strong, but API documentation is not bundled
- Analytics are computed server-side, but advanced caching is not added

These tradeoffs keep the code understandable and focused for an assignment setting.

## Future Improvements

- Enhance Swagger documentation with detailed request/response examples
- Add automated tests for guards, services, and analytics endpoints
- Introduce PostgreSQL for production-oriented persistence
- Add rate limiting and request throttling
- Add refresh tokens and session management
- Add soft delete support for financial records
- Expand pagination and sorting options

## Troubleshooting

### Prisma + SQLite Path

Use the standard local SQLite path:

```env
DATABASE_URL="file:./dev.db"
```

This creates the database file relative to the Prisma schema location.

### If `prisma db push` Fails on Windows

Recommended checks:

1. Confirm `.env` exists in the project root
2. Confirm `DATABASE_URL` is exactly `file:./dev.db`
3. Regenerate the client:

```bash
npm run prisma:generate
```

4. Retry schema push:

```bash
npm run prisma:push
```

5. If SQLite still fails in the local environment, switch to PostgreSQL by updating:

- `prisma/schema.prisma`
  Change datasource provider to `postgresql`
- `.env`
  Set `DATABASE_URL="postgresql://postgres:password@localhost:5432/finance_db"`

The current schema is intentionally simple enough to migrate cleanly to PostgreSQL if needed.

## Notable Design Decisions

- Implemented soft delete to preserve data integrity
- Backend-driven analytics to reduce frontend complexity
- Centralized RBAC using guards and decorators

## Evaluation Notes

This project is intentionally structured to make backend decisions easy to review:

- clear module boundaries
- thin controllers
- service-centered business logic
- centralized RBAC
- Prisma-backed persistence
- backend-owned analytics instead of frontend aggregation

The focus is maintainability, correctness, and scalable structure rather than framework-heavy complexity.
