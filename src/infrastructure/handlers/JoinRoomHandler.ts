import { Message } from '../../domain/entities/Message.ts';
import { WebSocketConnection } from '../../domain/entities/WebSocketConnection.ts';
import { MessageType } from '../../domain/value-objects/MessageType.ts';
import { BaseMessageHandler } from './base/BaseMessageHandler.ts';
import { BroadcastMessageUseCase } from '../../application/use-cases/BroadcastMessageUseCase.ts';
import { ILogger } from '../logging/LoggerService.ts';

export class JoinRoomHandler extends BaseMessageHandler {
  constructor(
    private readonly broadcastUseCase: BroadcastMessageUseCase,
    logger?: ILogger
  ) {
    super([MessageType.JOIN_ROOM], logger?.child({ handler: 'JoinRoomHandler' }));
  }

  async handle(message: Message, connection: WebSocketConnection): Promise<void> {
    const data = message.getData();
    const room = data.room;
    const username = data.username || 'Anonymous';
    
    this.logger.info('Processing join room request', {
      connectionId: connection.getId(),
      room,
      username
    });
    
    const errors = this.validateRequiredFields(data, ['room']);
    
    if (errors.length > 0) {
      this.logger.warn('Join room validation failed', {
        connectionId: connection.getId(),
        errors
      });
      await this.sendError(connection, errors.join(', '));
      return;
    }

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

    const joinNotification = new Message(
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
    
    this.logger.info('User joined room successfully', {
      connectionId: connection.getId(),
      room,
      username
    });
  }
}