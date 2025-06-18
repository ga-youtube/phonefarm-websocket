import { injectable, inject } from 'tsyringe';
import { Message } from '../../domain/entities/Message.ts';
import { WebSocketConnection } from '../../domain/entities/WebSocketConnection.ts';
import { IMessageHandlerRegistry } from '../ports/IMessageHandler.ts';
import { TOKENS } from '../../infrastructure/container/tokens.ts';

@injectable()
export class HandleMessageUseCase {
  constructor(
    @inject(TOKENS.MessageHandlerRegistry)
    private readonly handlerRegistry: IMessageHandlerRegistry
  ) {}

  async execute(message: Message, connection: WebSocketConnection): Promise<void> {
    const messageType = message.getType();
    const handler = this.handlerRegistry.getHandler(messageType);

    if (!handler) {
      throw new Error(`No handler found for message type: ${messageType}`);
    }

    await handler.handle(message, connection);
  }
}