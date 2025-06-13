import { Message } from '../../domain/entities/Message.ts';
import { WebSocketConnection } from '../../domain/entities/WebSocketConnection.ts';
import { MessageType } from '../../domain/value-objects/MessageType.ts';
import { BaseMessageHandler } from './base/BaseMessageHandler.ts';
import { BroadcastMessageUseCase } from '../../application/use-cases/BroadcastMessageUseCase.ts';

export class ChatMessageHandler extends BaseMessageHandler {
  constructor(
    private readonly broadcastUseCase: BroadcastMessageUseCase
  ) {
    super([MessageType.CHAT]);
  }

  async handle(message: Message, connection: WebSocketConnection): Promise<void> {
    const data = message.getData();
    const errors = this.validateRequiredFields(data, ['content']);
    
    if (errors.length > 0) {
      await this.sendError(connection, errors.join(', '));
      return;
    }

    const chatMessage = new Message(
      MessageType.CHAT,
      {
        content: data.content,
        author: data.author || 'Anonymous',
        room: data.room || 'general'
      },
      connection.getId()
    );

    const room = data.room || 'general';
    await this.broadcastUseCase.executeToRoom(chatMessage, room);
  }
}