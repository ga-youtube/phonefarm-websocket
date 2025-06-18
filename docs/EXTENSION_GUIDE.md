# Hướng Dẫn Mở Rộng Chức Năng

## Tổng Quan

Tài liệu này hướng dẫn cách mở rộng các chức năng cho WebSocket server được xây dựng theo Clean Architecture.

## 1. Thêm Message Type Mới

### Bước 1: Định nghĩa Message Type
```typescript
// src/domain/value-objects/MessageType.ts
export enum MessageType {
  // ... existing types
  YOUR_NEW_TYPE = 'your_new_type'
}
```

### Bước 2: Tạo Message Handler
```typescript
// src/infrastructure/handlers/YourNewHandler.ts
import { BaseMessageHandler } from './BaseMessageHandler';
import { Message } from '@/domain/entities/Message';
import { WebSocketConnection } from '@/domain/entities/WebSocketConnection';

export class YourNewHandler extends BaseMessageHandler {
  async handle(message: Message, connection: WebSocketConnection): Promise<void> {
    // Implement your business logic here
    await this.sendResponse(connection, {
      type: MessageType.YOUR_NEW_TYPE,
      data: {
        // response data
      }
    });
  }
}
```

### Bước 3: Đăng ký Handler
```typescript
// src/infrastructure/container/ServiceRegistry.ts
public static registerHandlers(container: DIContainer): void {
  // ... existing handlers
  container.register('YourNewHandler', YourNewHandler);
}
```

### Bước 4: Map Handler với Message Type
```typescript
// src/application/services/MessageDispatcher.ts
private initializeHandlers(): void {
  // ... existing mappings
  this.handlers.set(MessageType.YOUR_NEW_TYPE, 'YourNewHandler');
}
```

## 2. Thêm Use Case Mới

### Bước 1: Định nghĩa Interface
```typescript
// src/application/ports/IYourUseCase.ts
export interface IYourUseCase {
  execute(params: YourParams): Promise<YourResult>;
}
```

### Bước 2: Implement Use Case
```typescript
// src/application/use-cases/YourUseCase.ts
import { injectable, inject } from '@/infrastructure/container/decorators';
import { IYourUseCase } from '../ports/IYourUseCase';

@injectable()
export class YourUseCase implements IYourUseCase {
  constructor(
    @inject('IConnectionRepository') 
    private connectionRepository: IConnectionRepository
  ) {}

  async execute(params: YourParams): Promise<YourResult> {
    // Business logic here
  }
}
```

### Bước 3: Đăng ký trong Container
```typescript
// src/infrastructure/container/ServiceRegistry.ts
container.register<IYourUseCase>('IYourUseCase', YourUseCase);
```

## 3. Thêm Repository Mới

### Bước 1: Định nghĩa Interface trong Domain
```typescript
// src/domain/repositories/IYourRepository.ts
export interface IYourRepository {
  findById(id: string): Promise<YourEntity | null>;
  save(entity: YourEntity): Promise<void>;
  // ... other methods
}
```

### Bước 2: Implement Repository
```typescript
// src/infrastructure/repositories/YourRepository.ts
import { injectable } from '@/infrastructure/container/decorators';
import { IYourRepository } from '@/domain/repositories/IYourRepository';

@injectable()
export class YourRepository implements IYourRepository {
  private storage = new Map<string, YourEntity>();

  async findById(id: string): Promise<YourEntity | null> {
    return this.storage.get(id) || null;
  }

  async save(entity: YourEntity): Promise<void> {
    this.storage.set(entity.id, entity);
  }
}
```

## 4. Thêm Middleware

### Bước 1: Tạo Middleware
```typescript
// src/presentation/middleware/YourMiddleware.ts
import { WebSocketConnection } from '@/domain/entities/WebSocketConnection';
import { Message } from '@/domain/entities/Message';

export class YourMiddleware {
  async process(
    connection: WebSocketConnection, 
    message: Message, 
    next: () => Promise<void>
  ): Promise<void> {
    // Pre-processing logic
    console.log('Before processing:', message);
    
    await next();
    
    // Post-processing logic
    console.log('After processing:', message);
  }
}
```

### Bước 2: Đăng ký Middleware
```typescript
// src/presentation/controllers/WebSocketController.ts
private middlewares: Middleware[] = [
  new AuthenticationMiddleware(),
  new YourMiddleware(),
  // ... other middlewares
];
```

## 5. Thêm Validation Schema

### Bước 1: Định nghĩa Schema
```typescript
// src/infrastructure/validation/schemas/yourSchema.ts
import { z } from 'zod';

export const yourMessageSchema = z.object({
  type: z.literal(MessageType.YOUR_NEW_TYPE),
  data: z.object({
    field1: z.string(),
    field2: z.number().min(0),
    // ... other fields
  })
});
```

### Bước 2: Sử dụng trong Handler
```typescript
// src/infrastructure/handlers/YourNewHandler.ts
import { yourMessageSchema } from '../validation/schemas/yourSchema';

export class YourNewHandler extends BaseMessageHandler {
  async handle(message: Message, connection: WebSocketConnection): Promise<void> {
    const validatedData = yourMessageSchema.parse(message);
    // Use validatedData
  }
}
```

## 6. Thêm Service Mới

### Bước 1: Tạo Service Interface
```typescript
// src/application/services/IYourService.ts
export interface IYourService {
  performAction(params: any): Promise<Result>;
}
```

### Bước 2: Implement Service
```typescript
// src/infrastructure/services/YourService.ts
import { injectable } from '@/infrastructure/container/decorators';
import { IYourService } from '@/application/services/IYourService';

@injectable()
export class YourService implements IYourService {
  async performAction(params: any): Promise<Result> {
    // Service logic
  }
}
```

## 7. Testing

### Unit Test cho Handler
```typescript
// tests/handlers/YourNewHandler.test.ts
import { describe, it, expect, mock } from 'bun:test';
import { YourNewHandler } from '@/infrastructure/handlers/YourNewHandler';

describe('YourNewHandler', () => {
  it('should handle message correctly', async () => {
    const handler = new YourNewHandler();
    const mockConnection = createMockConnection();
    const message = createTestMessage();
    
    await handler.handle(message, mockConnection);
    
    expect(mockConnection.send).toHaveBeenCalledWith(
      expect.objectContaining({
        type: MessageType.YOUR_NEW_TYPE
      })
    );
  });
});
```

### Integration Test
```typescript
// tests/integration/yourFeature.test.ts
import { describe, it, expect } from 'bun:test';
import { createTestServer } from '../helpers/testServer';

describe('Your Feature Integration', () => {
  it('should process message end-to-end', async () => {
    const server = await createTestServer();
    const client = await connectTestClient(server.url);
    
    await client.send({
      type: MessageType.YOUR_NEW_TYPE,
      data: { /* test data */ }
    });
    
    const response = await client.receive();
    expect(response.type).toBe(MessageType.YOUR_NEW_TYPE);
  });
});
```

## Best Practices

1. **Tuân thủ Clean Architecture**: Giữ business logic trong Domain và Application layers
2. **Dependency Injection**: Luôn sử dụng DI container để quản lý dependencies
3. **Error Handling**: Implement proper error handling và logging
4. **Validation**: Validate tất cả input data sử dụng Zod schemas
5. **Testing**: Viết unit tests và integration tests cho mọi chức năng mới
6. **Documentation**: Cập nhật CLAUDE.md khi thêm chức năng quan trọng