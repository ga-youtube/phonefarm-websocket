import { container } from 'tsyringe';
import { IMessageHandler, IMessageHandlerRegistry } from '../../application/ports/IMessageHandler.ts';
import { MESSAGE_HANDLER_METADATA, MessageHandlerMetadata } from '../decorators/messageHandler.ts';
import { TOKENS } from './tokens.ts';

export class HandlerDiscovery {
  static discoverAndRegisterHandlers(handlerClasses: any[]): void {
    const registry = container.resolve<IMessageHandlerRegistry>(TOKENS.MessageHandlerRegistry);
    
    for (const HandlerClass of handlerClasses) {
      const metadata: MessageHandlerMetadata | undefined = Reflect.getMetadata(
        MESSAGE_HANDLER_METADATA, 
        HandlerClass
      );
      
      if (metadata) {
        const handler = container.resolve<IMessageHandler>(HandlerClass);
        registry.register(handler);
        
        console.log(`Registered handler ${HandlerClass.name} for types: ${metadata.messageTypes.join(', ')}`);
      }
    }
  }
}