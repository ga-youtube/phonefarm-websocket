# Kiến Trúc Hệ Thống

## Clean Architecture Overview

Dự án được xây dựng theo Clean Architecture với 4 layers chính:

```
┌─────────────────────────────────────────────────────┐
│                  Presentation Layer                  │
│            (Controllers, Middleware)                 │
├─────────────────────────────────────────────────────┤
│                 Application Layer                    │
│           (Use Cases, Services, Ports)              │
├─────────────────────────────────────────────────────┤
│                   Domain Layer                       │
│        (Entities, Value Objects, Interfaces)        │
├─────────────────────────────────────────────────────┤
│               Infrastructure Layer                   │
│    (WebSocket, Repositories, External Services)     │
└─────────────────────────────────────────────────────┘
```

## Layer Dependencies

- **Domain Layer**: Không phụ thuộc vào layer nào khác
- **Application Layer**: Chỉ phụ thuộc vào Domain Layer
- **Infrastructure Layer**: Phụ thuộc vào Domain và Application
- **Presentation Layer**: Phụ thuộc vào Application Layer

## Chi Tiết Các Layers

### 1. Domain Layer (`src/domain/`)

Layer trung tâm chứa business logic thuần túy:

```
domain/
├── entities/          # Core business objects
│   ├── Message.ts     # Message entity
│   └── WebSocketConnection.ts
├── value-objects/     # Immutable value objects
│   └── MessageType.ts # Message type enum
└── repositories/      # Repository interfaces
    └── IConnectionRepository.ts
```

**Nguyên tắc:**
- Không có dependencies bên ngoài
- Chứa business rules cốt lõi
- Entities và Value Objects immutable

### 2. Application Layer (`src/application/`)

Orchestrates business logic và định nghĩa use cases:

```
application/
├── use-cases/         # Application business rules
│   ├── HandleMessageUseCase.ts
│   └── BroadcastMessageUseCase.ts
├── services/          # Application services
│   └── MessageDispatcher.ts
└── ports/            # Input/Output interfaces
    ├── IMessageHandler.ts
    └── IWebSocketServer.ts
```

**Nguyên tắc:**
- Implement application-specific business rules
- Coordinate giữa Domain objects
- Định nghĩa interfaces cho external services

### 3. Infrastructure Layer (`src/infrastructure/`)

Implementation của technical details:

```
infrastructure/
├── websocket/         # WebSocket implementation
│   ├── BunWebSocketServer.ts
│   └── ConnectionRepository.ts
├── handlers/          # Message handlers
│   ├── BaseMessageHandler.ts
│   ├── JoinRoomHandler.ts
│   └── ChatMessageHandler.ts
├── container/         # DI container
│   ├── DIContainer.ts
│   ├── ServiceRegistry.ts
│   └── decorators.ts
└── validation/        # Data validation
    └── messageValidator.ts
```

**Nguyên tắc:**
- Implement interfaces từ Domain/Application
- Quản lý external dependencies
- Không chứa business logic

### 4. Presentation Layer (`src/presentation/`)

Entry points và user interface:

```
presentation/
├── controllers/       # Request controllers
│   └── WebSocketController.ts
└── middleware/        # Request middleware
    └── authMiddleware.ts
```

**Nguyên tắc:**
- Handle incoming requests
- Transform data cho Application layer
- Handle responses và errors

## Dependency Injection

### Container Structure

```typescript
DIContainer
├── ServiceRegistry    # Service registration
├── Lifecycle Manager  # Singleton/Transient
└── Dependency Graph   # Resolution logic
```

### Service Registration Flow

1. **Manual Registration** trong `ServiceRegistry.register()`
2. **Decorator-based** với `@injectable()` và `@inject()`
3. **Handler Registration** riêng biệt cho message handlers

## Message Processing Pipeline

```
Client → WebSocket → Controller → Dispatcher → Use Case → Handler
                                                    ↓
Client ← WebSocket ← Controller ← ─ ─ ─ ─ ─ ─ Response
```

### Detailed Flow:

1. **Connection**: Client kết nối qua WebSocket
2. **Message Receipt**: BunWebSocketServer nhận message
3. **Controller**: WebSocketController xử lý raw message
4. **Validation**: MessageDispatcher validate message schema
5. **Routing**: Route đến appropriate handler
6. **Use Case**: HandleMessageUseCase execute business logic
7. **Handler**: Specific handler xử lý message
8. **Response**: Send response về client

## Data Flow Examples

### Join Room Flow
```
1. Client sends: { type: "join_room", data: { roomId: "123" } }
2. WebSocketController receives message
3. MessageDispatcher validates against joinRoomSchema
4. Routes to JoinRoomHandler
5. Handler updates ConnectionRepository
6. Broadcasts to room members
7. Sends confirmation to client
```

### Chat Message Flow
```
1. Client sends: { type: "chat", data: { message: "Hello" } }
2. Validation checks if user in room
3. ChatMessageHandler processes
4. BroadcastMessageUseCase sends to room
5. All room members receive message
```

## Error Handling Strategy

### Error Types
- **ValidationError**: Invalid message format
- **BusinessError**: Business rule violations
- **SystemError**: Infrastructure failures

### Error Flow
```
Error → Handler catches → Logs error → Send error message → Client
```

## Logging Architecture

Sử dụng Winston với structured logging:

- **Transports**: Console (dev), File (prod)
- **Levels**: error, warn, info, debug
- **Format**: JSON với timestamp và metadata
- **Context**: Automatic context injection

## Performance Considerations

### Connection Management
- Connection pooling trong ConnectionRepository
- Lazy loading cho room members
- Efficient broadcast với room-based filtering

### Message Processing
- Async/await cho non-blocking operations
- Message queuing cho high throughput
- Validation caching cho repeated schemas

## Security Measures

### Authentication
- Token-based auth qua middleware
- Connection-level authentication
- Room-based authorization

### Data Validation
- Zod schemas cho tất cả messages
- Input sanitization
- Rate limiting per connection

## Scalability Path

### Horizontal Scaling
1. Load balancer trước WebSocket servers
2. Redis cho shared state
3. Message queue cho inter-server communication

### Vertical Scaling
1. Worker threads cho CPU-intensive tasks
2. Connection pooling optimization
3. Memory-efficient data structures