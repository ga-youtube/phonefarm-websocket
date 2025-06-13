import { IMessageHandler, IMessageHandlerRegistry } from '../../application/ports/IMessageHandler.ts';

export class MessageHandlerRegistry implements IMessageHandlerRegistry {
  private readonly handlers = new Map<string, IMessageHandler>();

  register(handler: IMessageHandler): void {
    const supportedTypes = this.getSupportedTypes(handler);
    
    for (const messageType of supportedTypes) {
      if (this.handlers.has(messageType)) {
        throw new Error(`Handler for message type '${messageType}' already registered`);
      }
      this.handlers.set(messageType, handler);
    }
  }

  getHandler(messageType: string): IMessageHandler | null {
    return this.handlers.get(messageType) || null;
  }

  getAllHandlers(): IMessageHandler[] {
    return Array.from(new Set(this.handlers.values()));
  }

  private getSupportedTypes(handler: IMessageHandler): string[] {
    const types: string[] = [];
    
    if ('supportedMessageTypes' in handler) {
      types.push(...(handler as any).supportedMessageTypes);
    }
    
    return types;
  }
}