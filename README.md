# Phone Farm WebSocket Server

A high-performance WebSocket server built with Bun.js for managing phone farm connections. The server follows Clean Architecture principles and uses TSyringe for dependency injection.

## Features

- 🚀 **High Performance**: Built with Bun.js for maximum speed
- 🏗️ **Clean Architecture**: Separation of concerns with clear boundaries
- 💉 **Dependency Injection**: TSyringe for IoC container
- 🔌 **Real-time Communication**: WebSocket support for instant messaging
- 📱 **Device Management**: Track and manage connected Android devices
- 🗄️ **PostgreSQL Database**: Persistent storage with Kysely query builder
- 🛡️ **Type Safety**: Full TypeScript support with strict mode
- 📝 **Logging**: Comprehensive logging with Winston
- 🔄 **Hot Reload**: Development server with hot module replacement

## Architecture

The project follows Clean Architecture with four main layers:

```
┌─────────────────────────────────────────┐
│          Presentation Layer             │
│     (Controllers & Middleware)          │
├─────────────────────────────────────────┤
│          Application Layer              │
│      (Use Cases & Services)             │
├─────────────────────────────────────────┤
│           Domain Layer                  │
│    (Entities & Business Rules)          │
├─────────────────────────────────────────┤
│        Infrastructure Layer             │
│  (Database, WebSocket, External APIs)   │
└─────────────────────────────────────────┘
```

## Prerequisites

- Bun.js >= 1.0.0
- PostgreSQL >= 14
- Node.js >= 18 (for some tooling)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/ga-youtube/phonefarm-websocket.git
cd phonefarm-websocket
```

2. Install dependencies:
```bash
bun install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/phonefarm
NODE_ENV=development
```

4. Run database migrations:
```bash
bun run db:migrate
```

## Usage

### Development
```bash
bun run dev
```
This starts the server with hot reload enabled.

### Production
```bash
bun run build
bun run start
```

### Testing
```bash
bun test
```

### Type Checking
```bash
bun run typecheck
```

## WebSocket API

### Connection
Connect to `ws://localhost:3000/ws`

### Message Types

### Join Room
```json
{
  "type": "join_room",
  "data": {
    "room": "general",
    "username": "john_doe"
  }
}
```

### Leave Room
```json
{
  "type": "leave_room",
  "data": {}
}
```

### Chat Message
```json
{
  "type": "chat",
  "data": {
    "message": "Hello, world!"
  }
}
```

#### Device Info
```json
{
  "type": "device_info",
  "data": {
    "serial": "device-serial",
    "brand": "Samsung",
    "model": "Galaxy S21",
    "androidRelease": "12",
    "androidSdkInt": 31,
    "imei": "123456789012345",
    "macAddress": "AA:BB:CC:DD:EE:FF",
    "wifiIpAddress": "192.168.1.100"
  }
}
```

## Project Structure

```
src/
├── domain/              # Core business logic
│   ├── entities/        # Business entities
│   ├── factories/       # Entity factories
│   ├── providers/       # Domain service interfaces
│   ├── repositories/    # Repository interfaces
│   └── value-objects/   # Value objects
├── application/         # Application business rules
│   ├── ports/          # Input/Output port interfaces
│   ├── services/       # Application services
│   └── use-cases/      # Use case implementations
├── infrastructure/      # External service implementations
│   ├── container/      # DI container configuration
│   ├── database/       # Database implementation
│   ├── decorators/     # Custom decorators
│   ├── handlers/       # Message handlers
│   ├── providers/      # Provider implementations
│   ├── repositories/   # Repository implementations
│   ├── validation/     # Input validation
│   └── websocket/      # WebSocket server
└── presentation/        # User interface adapters
    ├── controllers/    # Request controllers
    └── middleware/     # Request middleware
```

## Adding New Features

### Creating a New Message Handler

1. Create a new handler in `src/infrastructure/handlers/`:
```typescript
import { injectable, inject } from 'tsyringe';
import { BaseMessageHandler } from './base/BaseMessageHandler';
import { messageHandler } from '../decorators/messageHandler';
import { MessageType } from '../../domain/value-objects/MessageType';

@injectable()
@messageHandler(MessageType.YOUR_TYPE)
export class YourMessageHandler extends BaseMessageHandler {
  constructor(
    @inject(TOKENS.YourDependency)
    private readonly dependency: IYourDependency
  ) {
    super([MessageType.YOUR_TYPE]);
  }

  async handle(message: Message, connection: WebSocketConnection): Promise<void> {
    // Handler implementation
  }
}
```

2. Add the handler to the handlers array in `container.config.ts`

### Creating a New Service

1. Define the interface in the domain layer
2. Implement the service with `@injectable()` decorator
3. Add a token to `tokens.ts`
4. Register in `container.config.ts`

## Database Migrations

We use pgroll for zero-downtime PostgreSQL migrations:

```bash
# Create a new migration
bun run db:migrate

# Rollback the last migration
bun run db:rollback
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Built with [Bun.js](https://bun.sh)
- Uses [TSyringe](https://github.com/microsoft/tsyringe) for dependency injection
- Database queries with [Kysely](https://kysely.dev)
- Schema validation with [Zod](https://zod.dev)
- Logging with [Winston](https://github.com/winstonjs/winston)