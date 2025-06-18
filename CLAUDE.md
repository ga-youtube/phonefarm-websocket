# Phone Farm WebSocket Server - Claude Development Guide

## Project Overview
This is a WebSocket server built with Bun.js following Clean Architecture principles and using TSyringe for dependency injection.

## Architecture
The project follows Clean Architecture with these layers:
- **Domain**: Core business entities and interfaces
- **Application**: Use cases and business logic
- **Infrastructure**: External services, database, WebSocket implementation
- **Presentation**: Controllers and middleware

## Key Technologies
- **Runtime**: Bun.js
- **Language**: TypeScript
- **DI Container**: TSyringe with decorators
- **Database**: PostgreSQL with Kysely query builder
- **Validation**: Zod schemas
- **Logging**: Winston logger

## Development Guidelines

### 1. Dependency Injection
- All classes must use `@injectable()` decorator
- Use constructor injection with `@inject(TOKEN)` 
- Register services in `container.config.ts`
- Use Symbol tokens from `tokens.ts`

### 2. Code Style
- Use TypeScript strict mode
- Follow interface segregation principle
- Prefer composition over inheritance
- No direct instantiation with `new` - use factories

### 3. Testing
- Mock dependencies using TSyringe container
- Use `IDateProvider` for testable dates
- Isolate business logic in use cases

### 4. Git Workflow
- Feature branches from `main`
- Descriptive commit messages
- PR with detailed description
- Run `bun run typecheck` before commit

## Common Commands
```bash
bun run dev          # Start dev server with hot reload
bun run build        # Build for production
bun run typecheck    # Check TypeScript types
bun test            # Run tests
```

## Database Migrations
Using pgroll for zero-downtime migrations:
```bash
bun run db:migrate   # Apply migrations
bun run db:rollback  # Rollback last migration
```

## Adding New Features

### 1. New Message Handler
1. Create handler class extending `BaseMessageHandler`
2. Add `@injectable()` and `@messageHandler(MessageType)` decorators
3. Add to handler array in `container.config.ts`

### 2. New Service
1. Define interface in domain layer
2. Create implementation with `@injectable()`
3. Add token to `tokens.ts`
4. Register in `container.config.ts`

### 3. New Entity
1. Create in `domain/entities`
2. Create factory in `domain/factories` 
3. Use factory to create instances

## Environment Variables
Required in `.env`:
- `PORT`: WebSocket server port (default: 3000)
- `DATABASE_URL`: PostgreSQL connection string
- `NODE_ENV`: Environment (development/production)

## Project Structure
```
src/
├── domain/           # Business entities and interfaces
│   ├── entities/
│   ├── factories/
│   ├── providers/
│   └── value-objects/
├── application/      # Use cases and services
│   ├── ports/
│   ├── services/
│   └── use-cases/
├── infrastructure/   # External implementations
│   ├── container/    # DI configuration
│   ├── database/
│   ├── handlers/
│   ├── providers/
│   ├── validation/
│   └── websocket/
└── presentation/     # Controllers and middleware
    ├── controllers/
    └── middleware/
```

## Important Notes
- Always use dependency injection
- Follow Clean Architecture boundaries
- Keep business logic in use cases
- Use factories for entity creation
- Test with mocked dependencies