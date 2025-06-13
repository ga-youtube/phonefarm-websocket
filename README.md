# WebSocket Server with Clean Architecture

Một WebSocket server được xây dựng với Bun.js theo kiến trúc clean architecture, sử dụng TypeScript và các design patterns hiện đại.

## 🏗️ Kiến trúc

Dự án được tổ chức theo **Clean Architecture** với 4 layers chính:

### Domain Layer (`src/domain/`)
- **Entities**: Message, WebSocketConnection
- **Value Objects**: MessageType
- **Repositories**: IConnectionRepository (interfaces)

### Application Layer (`src/application/`)
- **Use Cases**: HandleMessageUseCase, BroadcastMessageUseCase
- **Ports**: IMessageHandler, IWebSocketServer
- **Services**: MessageDispatcher

### Infrastructure Layer (`src/infrastructure/`)
- **WebSocket**: BunWebSocketServer, ConnectionRepository
- **Handlers**: ChatMessageHandler, JoinRoomHandler, LeaveRoomHandler
- **Validation**: MessageValidator (with Zod)
- **Container**: Dependency Injection system

### Presentation Layer (`src/presentation/`)
- **Controllers**: WebSocketController
- **Middleware**: ValidationMiddleware, RateLimitMiddleware

## 🎯 Design Patterns

- **Command Pattern**: Message handlers
- **Repository Pattern**: Connection management
- **Dependency Injection**: IoC container
- **Strategy Pattern**: Message validation
- **Observer Pattern**: WebSocket events
- **Factory Pattern**: Handler creation

## 🚀 Cách sử dụng

### Cài đặt dependencies

```bash
bun install
```

### Chạy server

```bash
# Development mode (hot reload)
bun run dev

# Production mode
bun run build
bun run start
```

### Test với client

Mở `examples/client.html` trong trình duyệt để test WebSocket connection.

## 📡 Message Types

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
    "content": "Hello world!",
    "author": "john_doe",
    "room": "general"
  }
}
```

## 🔧 Mở rộng

### Thêm Message Handler mới

1. Tạo handler class kế thừa `BaseMessageHandler`
2. Implement logic xử lý trong method `handle()`
3. Đăng ký handler trong `ServiceRegistry`

### Thêm Validation Rules

Sử dụng Zod schemas trong `MessageValidator` để thêm validation rules mới.

### Thêm Middleware

Implement `IMiddleware` interface và thêm vào `MiddlewarePipeline`.

## 🌟 Tính năng

- ✅ Real-time WebSocket communication
- ✅ Room-based messaging
- ✅ Message validation với Zod
- ✅ Rate limiting
- ✅ Error handling
- ✅ Dependency injection
- ✅ Hot reload development
- ✅ TypeScript support
- ✅ Clean architecture
- ✅ Extensible design patterns

## 🏃‍♂️ Development Commands

```bash
# Type checking
bun run typecheck

# Run tests
bun test

# Build for production
bun run build
```