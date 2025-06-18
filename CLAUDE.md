# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Development with hot reload
bun run dev

# Production build and run
bun run build
bun run start

# Type checking
bun run typecheck

# Run tests
bun test
```

## Clean Architecture Structure

This WebSocket server follows Clean Architecture with strict layer separation:

### Domain Layer (`src/domain/`)
- Contains core business entities and value objects
- **Entities**: `Message`, `WebSocketConnection` - core business objects
- **Value Objects**: `MessageType` enum with validation
- **Repository Interfaces**: `IConnectionRepository` - contracts for data access

### Application Layer (`src/application/`)
- Contains business logic and use cases
- **Use Cases**: `HandleMessageUseCase`, `BroadcastMessageUseCase` - application-specific business rules
- **Ports**: `IMessageHandler`, `IWebSocketServer` - interfaces defining application boundaries
- **Services**: `MessageDispatcher` - coordinates message processing

### Infrastructure Layer (`src/infrastructure/`)
- Implementation details and external concerns
- **WebSocket**: `BunWebSocketServer`, `ConnectionRepository` - Bun.js WebSocket implementation
- **Handlers**: Message handlers implementing business logic for each message type
- **Container**: Custom dependency injection system with `DIContainer` and `ServiceRegistry`
- **Validation**: Zod-based message validation

### Presentation Layer (`src/presentation/`)
- Controllers and middleware for handling external interfaces
- **Controllers**: `WebSocketController` - handles WebSocket events
- **Middleware**: Request/response processing pipeline

## Dependency Injection System

The project uses custom DI container with lifecycle management:
- Services are registered in `ServiceRegistry.register()`
- Message handlers are separately registered in `ServiceRegistry.registerHandlers()`
- Container supports singleton and transient lifetimes
- All dependencies are resolved through the container

## Message Handler Pattern

New message handlers must:
1. Extend `BaseMessageHandler` class
2. Implement `handle()` method with business logic
3. Register in `ServiceRegistry.registerHandlers()`
4. Add corresponding `MessageType` enum value

## WebSocket Message Flow

1. Message received by `BunWebSocketServer`
2. Passed to `WebSocketController.handleMessage()`
3. Processed by `MessageDispatcher` (validation + routing)
4. Routed to appropriate handler via `HandleMessageUseCase`
5. Handler executes business logic and responses

## Path Aliases

- `@/*` maps to `./src/*` for clean imports

## Supported Message Types

- `join_room`: Join a chat room
- `leave_room`: Leave current room
- `chat`: Send chat message
- `broadcast`: Server broadcast message
- `ping`/`pong`: Connection health checks
- `error`: Error responses