import { injectable } from 'tsyringe';
import type { IMessageHandler, IMessageHandlerRegistry } from '../../application/ports/IMessageHandler.ts';

@injectable()
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
    // Check if handler has metadata from decorator
    const metadata = Reflect.getMetadata('messageTypes', handler.constructor);
    if (metadata && Array.isArray(metadata)) {
      return metadata;
    }
    
    // Fallback to checking if handler has supportedMessageTypes property
    if ('supportedMessageTypes' in handler && Array.isArray((handler as any).supportedMessageTypes)) {
      return (handler as any).supportedMessageTypes;
    }
    
    return [];
  }
}