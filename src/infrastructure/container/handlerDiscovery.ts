import { injectable, inject } from 'tsyringe';
import { container } from 'tsyringe';
import { IMessageHandler, IMessageHandlerRegistry } from '../../application/ports/IMessageHandler.ts';
import { MESSAGE_HANDLER_METADATA, MessageHandlerMetadata } from '../decorators/messageHandler.ts';
import { TOKENS } from './tokens.ts';
import { IHandlerDiscovery } from './IHandlerDiscovery.ts';

@injectable()
export class HandlerDiscovery implements IHandlerDiscovery {
  constructor(
    @inject(TOKENS.MessageHandlerRegistry)
    private readonly registry: IMessageHandlerRegistry
  ) {}
  
  discoverAndRegisterHandlers(handlerClasses: any[]): void {
    
    for (const HandlerClass of handlerClasses) {
      const metadata: MessageHandlerMetadata | undefined = Reflect.getMetadata(
        MESSAGE_HANDLER_METADATA, 
        HandlerClass
      );
      
      if (metadata) {
        const handler = container.resolve<IMessageHandler>(HandlerClass);
        this.registry.register(handler);
        
        console.log(`Registered handler ${HandlerClass.name} for types: ${metadata.messageTypes.join(', ')}`);
      }
    }
  }
}