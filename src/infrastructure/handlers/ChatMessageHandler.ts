import { Message } from '../../domain/entities/Message.ts';
import { WebSocketConnection } from '../../domain/entities/WebSocketConnection.ts';
import { MessageType } from '../../domain/value-objects/MessageType.ts';
import { BaseMessageHandler } from './base/BaseMessageHandler.ts';
import { BroadcastMessageUseCase } from '../../application/use-cases/BroadcastMessageUseCase.ts';
import { ILogger } from '../logging/LoggerService.ts';

export class ChatMessageHandler extends BaseMessageHandler {
  constructor(
    private readonly broadcastUseCase: BroadcastMessageUseCase,
    logger?: ILogger
  ) {
    super([MessageType.CHAT], logger?.child({ handler: 'ChatMessageHandler' }));
  }

  async handle(message: Message, connection: WebSocketConnection): Promise<void> {
    const data = message.getData();
    const room = data.room || 'general';
    const author = data.author || 'Anonymous';
    
    this.logger.info('Processing chat message', {
      connectionId: connection.getId(),
      room,
      author,
      contentLength: data.content?.length || 0
    });
    
    const errors = this.validateRequiredFields(data, ['content']);
    
    if (errors.length > 0) {
      this.logger.warn('Chat message validation failed', {
        connectionId: connection.getId(),
        errors
      });
      await this.sendError(connection, errors.join(', '));
      return;
    }

    const chatMessage = new Message(
      MessageType.CHAT,
      {
        content: data.content,
        author,
        room
      },
      connection.getId()
    );

    await this.broadcastUseCase.executeToRoom(chatMessage, room);
    
    this.logger.info('Chat message broadcasted successfully', {
      connectionId: connection.getId(),
      room,
      author
    });
  }
}