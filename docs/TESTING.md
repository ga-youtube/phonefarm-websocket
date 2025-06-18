# Hướng Dẫn Testing

## Tổng Quan

Dự án sử dụng Bun test runner với các loại test:
- Unit Tests: Test từng component riêng lẻ
- Integration Tests: Test tương tác giữa các components
- E2E Tests: Test toàn bộ flow từ client đến server

## Cấu Trúc Test

```
tests/
├── unit/                  # Unit tests
│   ├── domain/           # Domain layer tests
│   ├── application/      # Application layer tests
│   └── infrastructure/   # Infrastructure tests
├── integration/          # Integration tests
│   ├── handlers/        # Handler integration tests
│   └── websocket/       # WebSocket integration tests
├── e2e/                  # End-to-end tests
├── fixtures/             # Test data
└── helpers/              # Test utilities
```

## Unit Testing

### Test Domain Entities

```typescript
// tests/unit/domain/entities/Message.test.ts
import { describe, it, expect } from 'bun:test';
import { Message } from '@/domain/entities/Message';
import { MessageType } from '@/domain/value-objects/MessageType';

describe('Message Entity', () => {
  it('should create a valid message', () => {
    const message = new Message({
      type: MessageType.CHAT,
      data: { message: 'Hello' },
      timestamp: Date.now(),
      id: 'msg-123'
    });

    expect(message.type).toBe(MessageType.CHAT);
    expect(message.data.message).toBe('Hello');
    expect(message.id).toBe('msg-123');
  });

  it('should generate id if not provided', () => {
    const message = new Message({
      type: MessageType.CHAT,
      data: { message: 'Hello' }
    });

    expect(message.id).toBeDefined();
    expect(message.id).toMatch(/^msg-/);
  });

  it('should validate message type', () => {
    expect(() => {
      new Message({
        type: 'invalid_type' as any,
        data: {}
      });
    }).toThrow('Invalid message type');
  });
});
```

### Test Use Cases

```typescript
// tests/unit/application/use-cases/HandleMessageUseCase.test.ts
import { describe, it, expect, mock, beforeEach } from 'bun:test';
import { HandleMessageUseCase } from '@/application/use-cases/HandleMessageUseCase';
import { IMessageHandler } from '@/application/ports/IMessageHandler';
import { Message } from '@/domain/entities/Message';
import { WebSocketConnection } from '@/domain/entities/WebSocketConnection';

describe('HandleMessageUseCase', () => {
  let useCase: HandleMessageUseCase;
  let mockHandler: IMessageHandler;
  let mockContainer: any;

  beforeEach(() => {
    mockHandler = {
      handle: mock(() => Promise.resolve())
    };

    mockContainer = {
      resolve: mock(() => mockHandler)
    };

    useCase = new HandleMessageUseCase(mockContainer);
  });

  it('should handle message with correct handler', async () => {
    const message = new Message({
      type: MessageType.CHAT,
      data: { message: 'Test' }
    });
    const connection = new WebSocketConnection('conn-123', {} as any);

    await useCase.execute('ChatHandler', message, connection);

    expect(mockContainer.resolve).toHaveBeenCalledWith('ChatHandler');
    expect(mockHandler.handle).toHaveBeenCalledWith(message, connection);
  });

  it('should throw error if handler not found', async () => {
    mockContainer.resolve = mock(() => null);

    const message = new Message({
      type: MessageType.CHAT,
      data: {}
    });
    const connection = new WebSocketConnection('conn-123', {} as any);

    await expect(
      useCase.execute('NonExistentHandler', message, connection)
    ).rejects.toThrow('Handler not found');
  });
});
```

### Test Handlers

```typescript
// tests/unit/infrastructure/handlers/ChatMessageHandler.test.ts
import { describe, it, expect, mock, beforeEach } from 'bun:test';
import { ChatMessageHandler } from '@/infrastructure/handlers/ChatMessageHandler';
import { Message } from '@/domain/entities/Message';
import { WebSocketConnection } from '@/domain/entities/WebSocketConnection';
import { IConnectionRepository } from '@/domain/repositories/IConnectionRepository';

describe('ChatMessageHandler', () => {
  let handler: ChatMessageHandler;
  let mockRepository: IConnectionRepository;
  let mockBroadcastUseCase: any;

  beforeEach(() => {
    mockRepository = {
      findById: mock(),
      save: mock(),
      remove: mock(),
      findByRoom: mock(() => Promise.resolve([]))
    };

    mockBroadcastUseCase = {
      execute: mock(() => Promise.resolve())
    };

    handler = new ChatMessageHandler(mockRepository, mockBroadcastUseCase);
  });

  it('should broadcast message to room members', async () => {
    const connection = new WebSocketConnection('conn-123', {} as any);
    connection.roomId = 'room-123';
    connection.userId = 'user-123';

    const message = new Message({
      type: MessageType.CHAT,
      data: { message: 'Hello room!' }
    });

    const roomConnections = [
      connection,
      new WebSocketConnection('conn-456', {} as any)
    ];

    mockRepository.findByRoom = mock(() => Promise.resolve(roomConnections));

    await handler.handle(message, connection);

    expect(mockBroadcastUseCase.execute).toHaveBeenCalledWith(
      roomConnections,
      expect.objectContaining({
        type: MessageType.CHAT,
        data: expect.objectContaining({
          message: 'Hello room!',
          username: 'user-123',
          roomId: 'room-123'
        })
      })
    );
  });

  it('should return error if user not in room', async () => {
    const connection = new WebSocketConnection('conn-123', {} as any);
    connection.send = mock();
    // No roomId set

    const message = new Message({
      type: MessageType.CHAT,
      data: { message: 'Hello!' }
    });

    await handler.handle(message, connection);

    expect(connection.send).toHaveBeenCalledWith(
      expect.objectContaining({
        type: MessageType.ERROR,
        data: expect.objectContaining({
          code: 'NOT_IN_ROOM'
        })
      })
    );
  });
});
```

## Integration Testing

### WebSocket Server Integration

```typescript
// tests/integration/websocket/BunWebSocketServer.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import { BunWebSocketServer } from '@/infrastructure/websocket/BunWebSocketServer';
import { DIContainer } from '@/infrastructure/container/DIContainer';
import { ServiceRegistry } from '@/infrastructure/container/ServiceRegistry';

describe('BunWebSocketServer Integration', () => {
  let server: BunWebSocketServer;
  let container: DIContainer;
  let serverUrl: string;

  beforeAll(async () => {
    container = new DIContainer();
    ServiceRegistry.register(container);
    ServiceRegistry.registerHandlers(container);

    server = container.resolve('IWebSocketServer');
    const port = await getAvailablePort();
    await server.start(port);
    serverUrl = `ws://localhost:${port}`;
  });

  afterAll(async () => {
    await server.stop();
  });

  it('should accept WebSocket connections', async () => {
    const client = new WebSocket(serverUrl);
    
    await new Promise((resolve) => {
      client.onopen = resolve;
    });

    expect(client.readyState).toBe(WebSocket.OPEN);
    client.close();
  });

  it('should handle join room message', async () => {
    const client = new WebSocket(serverUrl);
    
    await new Promise((resolve) => {
      client.onopen = resolve;
    });

    const responsePromise = new Promise((resolve) => {
      client.onmessage = (event) => {
        resolve(JSON.parse(event.data));
      };
    });

    client.send(JSON.stringify({
      type: 'join_room',
      data: { roomId: 'test-room' }
    }));

    const response = await responsePromise;
    expect(response.type).toBe('join_room');
    expect(response.data.success).toBe(true);
    expect(response.data.roomId).toBe('test-room');

    client.close();
  });
});
```

### Message Flow Integration

```typescript
// tests/integration/MessageFlow.test.ts
import { describe, it, expect } from 'bun:test';
import { createTestServer, createTestClient } from '../helpers';

describe('Message Flow Integration', () => {
  it('should handle complete chat flow', async () => {
    const server = await createTestServer();
    const client1 = await createTestClient(server.url);
    const client2 = await createTestClient(server.url);

    // Both clients join same room
    await client1.send({ type: 'join_room', data: { roomId: 'chat-room' } });
    await client2.send({ type: 'join_room', data: { roomId: 'chat-room' } });

    // Client1 sends message
    const messagePromise = client2.waitForMessage();
    await client1.send({ 
      type: 'chat', 
      data: { message: 'Hello from client1!' } 
    });

    // Client2 should receive the message
    const message = await messagePromise;
    expect(message.type).toBe('chat');
    expect(message.data.message).toBe('Hello from client1!');

    await client1.close();
    await client2.close();
    await server.stop();
  });
});
```

## E2E Testing

### Complete User Journey

```typescript
// tests/e2e/UserJourney.test.ts
import { describe, it, expect } from 'bun:test';
import { TestClient } from '../helpers/TestClient';

describe('User Journey E2E', () => {
  it('should complete full user journey', async () => {
    const client = new TestClient('ws://localhost:3000');
    await client.connect();

    // 1. Join lobby
    const joinResponse = await client.joinRoom('lobby');
    expect(joinResponse.success).toBe(true);

    // 2. Send chat message
    const chatResponse = await client.sendChat('Hello everyone!');
    expect(chatResponse).toBeDefined();

    // 3. Join another room
    const gameRoomResponse = await client.joinRoom('game-room-1');
    expect(gameRoomResponse.success).toBe(true);

    // 4. Leave room
    const leaveResponse = await client.leaveRoom();
    expect(leaveResponse.success).toBe(true);

    // 5. Disconnect
    await client.disconnect();
  });
});
```

## Test Helpers

### Mock WebSocket

```typescript
// tests/helpers/MockWebSocket.ts
export class MockWebSocket {
  readyState = WebSocket.OPEN;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onclose: (() => void) | null = null;
  sentMessages: any[] = [];

  send(data: string) {
    this.sentMessages.push(JSON.parse(data));
  }

  receiveMessage(message: any) {
    if (this.onmessage) {
      this.onmessage(new MessageEvent('message', {
        data: JSON.stringify(message)
      }));
    }
  }

  close() {
    this.readyState = WebSocket.CLOSED;
    if (this.onclose) {
      this.onclose();
    }
  }
}
```

### Test Client Helper

```typescript
// tests/helpers/TestClient.ts
export class TestClient {
  private ws: WebSocket;
  private messageQueue: any[] = [];
  private messageResolvers: ((message: any) => void)[] = [];

  constructor(private url: string) {}

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.url);
      
      this.ws.onopen = () => resolve();
      this.ws.onerror = (error) => reject(error);
      
      this.ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        const resolver = this.messageResolvers.shift();
        if (resolver) {
          resolver(message);
        } else {
          this.messageQueue.push(message);
        }
      };
    });
  }

  async send(message: any): Promise<void> {
    this.ws.send(JSON.stringify(message));
  }

  async waitForMessage(): Promise<any> {
    const queued = this.messageQueue.shift();
    if (queued) {
      return queued;
    }

    return new Promise((resolve) => {
      this.messageResolvers.push(resolve);
    });
  }

  async joinRoom(roomId: string): Promise<any> {
    await this.send({ type: 'join_room', data: { roomId } });
    return this.waitForMessage();
  }

  async sendChat(message: string): Promise<any> {
    await this.send({ type: 'chat', data: { message } });
    return this.waitForMessage();
  }

  async disconnect(): Promise<void> {
    this.ws.close();
  }
}
```

## Test Configuration

### Test Setup

```typescript
// tests/setup.ts
import { beforeAll, afterAll } from 'bun:test';
import { logger } from '@/infrastructure/logging/logger';

beforeAll(() => {
  // Disable logging during tests
  logger.silent = true;
  
  // Setup test environment
  process.env.NODE_ENV = 'test';
});

afterAll(() => {
  // Cleanup
});
```

### Test Scripts

```json
// package.json
{
  "scripts": {
    "test": "bun test",
    "test:unit": "bun test tests/unit",
    "test:integration": "bun test tests/integration",
    "test:e2e": "bun test tests/e2e",
    "test:watch": "bun test --watch",
    "test:coverage": "bun test --coverage"
  }
}
```

## Mocking Strategies

### Mock Dependencies

```typescript
// tests/mocks/mockDependencies.ts
export function createMockRepository(): IConnectionRepository {
  return {
    findById: mock(() => Promise.resolve(null)),
    save: mock(() => Promise.resolve()),
    remove: mock(() => Promise.resolve()),
    findByRoom: mock(() => Promise.resolve([]))
  };
}

export function createMockConnection(id: string): WebSocketConnection {
  const mockWs = {
    send: mock(),
    close: mock(),
    readyState: 1
  };
  
  const connection = new WebSocketConnection(id, mockWs as any);
  return connection;
}
```

## Performance Testing

### Load Testing

```typescript
// tests/performance/load.test.ts
import { describe, it, expect } from 'bun:test';

describe('Load Testing', () => {
  it('should handle 100 concurrent connections', async () => {
    const clients: WebSocket[] = [];
    const startTime = Date.now();

    // Create 100 connections
    for (let i = 0; i < 100; i++) {
      const client = new WebSocket('ws://localhost:3000');
      await new Promise((resolve) => {
        client.onopen = resolve;
      });
      clients.push(client);
    }

    const connectionTime = Date.now() - startTime;
    expect(connectionTime).toBeLessThan(5000); // Should connect all within 5 seconds

    // Cleanup
    for (const client of clients) {
      client.close();
    }
  });

  it('should handle 1000 messages per second', async () => {
    const client = new WebSocket('ws://localhost:3000');
    await new Promise((resolve) => {
      client.onopen = resolve;
    });

    const startTime = Date.now();
    const messageCount = 1000;

    for (let i = 0; i < messageCount; i++) {
      client.send(JSON.stringify({
        type: 'ping',
        data: {}
      }));
    }

    const duration = Date.now() - startTime;
    const messagesPerSecond = (messageCount / duration) * 1000;
    
    expect(messagesPerSecond).toBeGreaterThan(900); // At least 900 msg/s
    client.close();
  });
});
```

## CI/CD Integration

### GitHub Actions

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - uses: oven-sh/setup-bun@v1
      with:
        bun-version: latest
    
    - name: Install dependencies
      run: bun install
    
    - name: Run type check
      run: bun run typecheck
    
    - name: Run unit tests
      run: bun test:unit
    
    - name: Run integration tests
      run: bun test:integration
    
    - name: Run E2E tests
      run: bun test:e2e
    
    - name: Upload coverage
      uses: codecov/codecov-action@v3
      with:
        files: ./coverage/lcov.info
```

## Best Practices

1. **Test Isolation**: Mỗi test phải độc lập
2. **Clear Test Names**: Mô tả rõ ràng test case
3. **AAA Pattern**: Arrange, Act, Assert
4. **Mock External Dependencies**: Không gọi external services
5. **Test Edge Cases**: Test cả happy path và error cases
6. **Performance Benchmarks**: Monitor performance regression
7. **Cleanup**: Always cleanup resources sau mỗi test