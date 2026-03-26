# RestoPro NestJS Backend Scaffold

## Overview
Production-ready NestJS backend scaffold for RestoPro restaurant management system with full modular architecture.

## File Structure Summary

### Root Configuration
- `package.json` - Dependencies and scripts (dev, build, test, db commands)
- `tsconfig.json` - Strict TypeScript configuration with decorators enabled
- `nest-cli.json` - NestJS CLI configuration
- `src/main.ts` - Bootstrap with CORS, validation, WebSocket setup

### Core Application
- `src/app.module.ts` - Root module importing all 9 domain modules

### Common Infrastructure (Shared across all modules)
- `src/common/prisma/` - Database service (PrismaService extends PrismaClient)
- `src/common/guards/` - JWT auth guard, role-based authorization guard
- `src/common/decorators/` - @Roles, @CurrentUser parameter decorators
- `src/common/filters/` - Global HTTP exception filter with error format
- `src/common/interceptors/` - Request logging interceptor with timing
- `src/common/dto/` - Cursor-based pagination DTO

### Domain Modules (9 modules)

Each module follows NestJS best practices with:
- Module (imports, providers, controllers, exports)
- Service (business logic with TODO stubs)
- Controller (REST endpoints with proper guards and decorators)

#### 1. Auth Module (`src/modules/auth/`)
- **AuthService**: register, login, refreshToken, validateUser
- **AuthController**: POST /auth/register, /login, /refresh
- **JwtStrategy**: Passport JWT strategy
- **DTOs**: LoginDto, RegisterDto with validation

#### 2. Orders Module (`src/modules/orders/`)
- **Endpoints**: GET /, GET /:id, POST /, PATCH /:id/status, DELETE /:id
- **Roles**: OWNER, MANAGER, STAFF can create/read; KITCHEN can read status
- TODO: Double-entry accounting on order creation

#### 3. Kitchen Module (`src/modules/kitchen/`)
- **KitchenService**: Kitchen display logic, station routing, item status
- **KitchenGateway**: WebSocket gateway for real-time order updates
- **Endpoints**: GET /display, GET /station/:station, PATCH status, bump orders
- TODO: Real-time WebSocket broadcast to kitchen display

#### 4. Menu Module (`src/modules/menu/`)
- **Endpoints**: GET /categories, GET /items, POST/PATCH/DELETE items
- **Public GET endpoints** for customer QR ordering
- **Protected CRUD** for OWNER/MANAGER roles
- TODO: Recipe management with ingredient mappings

#### 5. Tables Module (`src/modules/tables/`)
- **Endpoints**: CRUD for table management, status updates, QR code generation
- **Table states**: available, occupied, reserved, dirty
- **Roles**: STAFF manages tables, OWNER/MANAGER configure
- TODO: QR code generation per table

#### 6. Inventory Module (`src/modules/inventory/`)
- **Endpoints**: Ingredients, recipes, stock updates, waste tracking
- **Stock levels** and FIFO costing
- **Waste tracking** separate from normal deductions
- TODO: Recipe-based automatic deduction on order placement

#### 7. Finance Module (`src/modules/finance/`)
- **Endpoints**: Daily summary, revenue trends, payment breakdown, top items
- **Expense tracking** with double-entry accounting
- **Trial balance validation** (must equal zero)
- **Period closing** locks previous periods
- TODO: Vietnamese accounting standards compliance (TT200/TT133)

#### 8. Customers Module (`src/modules/customers/`)
- **Endpoints**: Customer CRUD, order history, loyalty points
- **Promotions** management (percentage, fixed, loyalty-based)
- **Order history** and customer profiles
- TODO: Zalo integration for marketing

#### 9. Staff Module (`src/modules/staff/`)
- **Endpoints**: Staff CRUD, scheduling, clock-in/out, payroll
- **Shift management** with staff assignment
- **Payroll summary** calculation
- TODO: Vietnamese income tax integration

#### 10. Reports Module (`src/modules/reports/`)
- **Endpoints**: P&L, cash flow, food cost, menu engineering, accounting
- **Formats**: PDF, Excel, JSON export
- **Natural language queries** via Claude API (stub)
- TODO: Vietnamese accounting reports (GL, trial balance, tax exports)

## Key Features

### Architecture
- Modular monolith (Phase 1) with easy extraction to microservices
- Dependency injection throughout
- Repository pattern ready (services abstracted from direct DB access)

### Authentication & Authorization
- JWT-based with refresh tokens
- Role-based access control: OWNER > MANAGER > STAFF > KITCHEN
- Global guards and decorators for easy protection

### Real-time Capabilities
- WebSocket gateway for kitchen display (Socket.io)
- Ready for Redis integration (Upstash)
- Order updates broadcast to kitchen staff

### Database
- Prisma ORM for type safety
- All timestamps in UTC
- Soft deletes for financial compliance
- Multi-tenant ready (restaurantId on all requests)

### Error Handling
- Global exception filter with standardized error format
- Logging interceptor with request timing
- Proper HTTP status codes

### Validation
- Class-validator on all DTOs
- Strict TypeScript mode
- Input sanitization via Zod-ready structure

## Scripts

```bash
pnpm dev              # Hot reload development
pnpm build            # Build to dist/
pnpm start            # Run production build
pnpm test             # Run tests (jest)
pnpm db:migrate       # Run Prisma migrations
pnpm db:seed          # Seed database
pnpm db:studio        # Open Prisma Studio
```

## Next Steps

1. **Database Schema**: Create Prisma schema (users, restaurants, orders, etc.)
2. **Environment Variables**: Set up .env with JWT_SECRET, DATABASE_URL, etc.
3. **Module Implementation**: Fill in TODO stubs in services
4. **Testing**: Add unit and integration tests
5. **API Documentation**: Generate OpenAPI/Swagger docs
6. **Deployment**: Deploy to Railway or Vercel Functions

## Notes

- All monetary values should be stored as **integers in VND** (no decimals)
- All dates stored in **UTC**, converted to GMT+7 at display layer
- Vietnamese-specific: Accounting follows Circular TT200/2014
- Financial accuracy is non-negotiable - test all accounting entries
- WebSocket real-time updates are critical for kitchen display
