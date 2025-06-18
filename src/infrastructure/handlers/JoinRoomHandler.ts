import { injectable, inject } from 'tsyringe';
import { Message } from '../../domain/entities/Message.ts';
import { WebSocketConnection } from '../../domain/entities/WebSocketConnection.ts';
import { MessageType } from '../../domain/value-objects/MessageType.ts';
import { BaseMessageHandler } from './base/BaseMessageHandler.ts';
import { BroadcastMessageUseCase } from '../../application/use-cases/BroadcastMessageUseCase.ts';
import type { IMessageFactory } from '../../domain/factories/MessageFactory.ts';
import { TOKENS } from '../container/tokens.ts';
import { messageHandler } from '../decorators/messageHandler.ts';

@injectable()
@messageHandler(MessageType.JOIN_ROOM)
export class JoinRoomHandler extends BaseMessageHandler {
  constructor(
    @inject(TOKENS.BroadcastMessageUseCase)
    private readonly broadcastUseCase: BroadcastMessageUseCase,
    @inject(TOKENS.MessageFactory)
    messageFactory: IMessageFactory
  ) {
    super([MessageType.JOIN_ROOM]);
    this.messageFactory = messageFactory;
  }

  async handle(message: Message, connection: WebSocketConnection): Promise<void> {
    const data = message.getData();
    const errors = this.validateRequiredFields(data, ['room']);
    
    if (errors.length > 0) {
      await this.sendError(connection, errors.join(', '));
      return;
    }

    const room = data.room;
    const username = data.username || 'Anonymous';

    connection.updateMetadata({ 
      room, 
      userId: data.userId,
      username 
    });

    await this.sendResponse(connection, MessageType.JOIN_ROOM, {
      success: true,
      room,
      message: `Successfully joined room: ${room}`
    });

    const joinNotification = this.messageFactory.create(
      MessageType.BROADCAST,
      {
        type: 'user_joined',
        room,
        username,
        message: `${username} joined the room`
      }
    );

    await this.broadcastUseCase.executeToRoom(
      joinNotification, 
      room, 
      connection.getId()
    );
  }
}