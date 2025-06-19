import { injectable, inject } from 'tsyringe';
import { container } from 'tsyringe';
import type { IMessageHandler, IMessageHandlerRegistry } from '../../application/ports/IMessageHandler.ts';
import { MESSAGE_HANDLER_METADATA, MessageHandlerMetadata } from '../decorators/messageHandler.ts';
import { TOKENS } from './tokens.ts';
import { IHandlerDiscovery, MessageHandlerConstructor } from '../../application/ports/IHandlerDiscovery.ts';
import { ILogger } from '../../domain/providers/ILogger.ts';

@injectable()
export class HandlerDiscovery implements IHandlerDiscovery {
  constructor(
    @inject(TOKENS.MessageHandlerRegistry)
    private readonly registry: IMessageHandlerRegistry,
    @inject(TOKENS.Logger)
    private readonly logger: ILogger
  ) {}
  
  discoverAndRegisterHandlers(handlerClasses: MessageHandlerConstructor[]): void {
    
    for (const HandlerClass of handlerClasses) {
      const metadata: MessageHandlerMetadata | undefined = Reflect.getMetadata(
        MESSAGE_HANDLER_METADATA, 
        HandlerClass
      );
      
      if (metadata) {
        const handler = container.resolve<IMessageHandler>(HandlerClass);
        this.registry.register(handler);
        
        this.logger.info(`Registered handler ${HandlerClass.name} for types: ${metadata.messageTypes.join(', ')}`);
      }
    }
  }
}