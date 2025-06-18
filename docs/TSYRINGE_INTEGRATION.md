# TSyringe Integration Guide

## Overview

This project has been migrated from a custom DIContainer implementation to TSyringe, a powerful dependency injection container for TypeScript applications.

## Architecture

### Dependency Injection Tokens

All injection tokens are defined in `src/infrastructure/container/tokens.ts`:

```typescript
export const TOKENS = {
  ConnectionRepository: Symbol.for('ConnectionRepository'),
  DeviceRepository: Symbol.for('DeviceRepository'),
  BunWebSocketServer: Symbol.for('BunWebSocketServer'),
  // ... other tokens
}
```

### Container Configuration

The main container configuration is in `src/infrastructure/container/container.config.ts`. This file:
- Registers all services, repositories, and handlers
- Sets up auto-discovery for message handlers
- Configures lifecycles (singleton vs transient)

### Decorators

#### @injectable()
All classes that will be injected must be decorated with `@injectable()`:

```typescript
@injectable()
export class MyService {
  // ...
}
```

#### @inject()
Dependencies are injected using the `@inject()` decorator:

```typescript
@injectable()
export class MyService {
  constructor(
    @inject(TOKENS.MyDependency)
    private readonly dependency: IMyDependency
  ) {}
}
```

#### @messageHandler()
Custom decorator for auto-registering message handlers:

```typescript
@injectable()
@messageHandler(MessageType.CHAT)
export class ChatMessageHandler extends BaseMessageHandler {
  // ...
}
```

## Adding New Services

1. Define the interface:
```typescript
export interface IMyService {
  doSomething(): Promise<void>;
}
```

2. Create the implementation:
```typescript
@injectable()
export class MyService implements IMyService {
  constructor(
    @inject(TOKENS.SomeDependency)
    private readonly dependency: ISomeDependency
  ) {}
  
  async doSomething(): Promise<void> {
    // Implementation
  }
}
```

3. Add token to `tokens.ts`:
```typescript
export const TOKENS = {
  // ... existing tokens
  MyService: Symbol.for('MyService'),
}
```

4. Register in `container.config.ts`:
```typescript
container.registerSingleton<IMyService>(TOKENS.MyService, MyService);
```

## Adding New Message Handlers

1. Create the handler class:
```typescript
@injectable()
@messageHandler(MessageType.MY_MESSAGE)
export class MyMessageHandler extends BaseMessageHandler {
  constructor(
    @inject(TOKENS.SomeDependency)
    private readonly dependency: ISomeDependency
  ) {
    super([MessageType.MY_MESSAGE]);
  }
  
  async handle(message: Message, connection: WebSocketConnection): Promise<void> {
    // Handler logic
  }
}
```

2. Add to handler classes array in `container.config.ts`:
```typescript
const handlerClasses = [
  // ... existing handlers
  MyMessageHandler
];
```

## Lifecycle Management

### Singleton
Services registered as singleton will have only one instance throughout the application:
```typescript
container.registerSingleton<IMyService>(TOKENS.MyService, MyService);
```

### Transient
Services registered as transient will create a new instance each time they are resolved:
```typescript
container.register<IMyHandler>(TOKENS.MyHandler, MyHandler);
```

## Testing

When writing tests, you can create a test container:

```typescript
import { container } from 'tsyringe';

describe('MyService', () => {
  beforeEach(() => {
    container.reset();
    // Register test dependencies
    container.register(TOKENS.MyDependency, {
      useValue: mockDependency
    });
  });
  
  it('should do something', async () => {
    const service = container.resolve<MyService>(MyService);
    await service.doSomething();
    // assertions
  });
});
```

## Benefits of TSyringe

1. **Type Safety**: Full TypeScript support with compile-time checking
2. **Decorators**: Clean, declarative syntax
3. **Auto-wiring**: Automatic dependency resolution
4. **Lifecycle Management**: Built-in singleton and transient scopes
5. **Testing**: Easy to mock dependencies for testing
6. **Performance**: Minimal runtime overhead

## Migration from Old DIContainer

The old DIContainer used string-based keys and manual factory functions:

```typescript
// Old
container.registerSingleton('MyService', () => new MyService(dependency));
const service = container.resolve<MyService>('MyService');

// New with TSyringe
@injectable()
class MyService {
  constructor(@inject(TOKENS.Dependency) dependency: IDependency) {}
}
const service = container.resolve<MyService>(TOKENS.MyService);
```

## Common Issues and Solutions

### Circular Dependencies
If you encounter circular dependency issues:
1. Use `@inject(() => TOKENS.Dependency)` with a factory function
2. Consider refactoring to break the circular dependency
3. Use interfaces to decouple implementations

### Missing Decorators
Ensure all classes have `@injectable()` decorator before using them in DI.

### Registration Order
Some services may need to be registered in a specific order. The `container.config.ts` file handles this automatically.