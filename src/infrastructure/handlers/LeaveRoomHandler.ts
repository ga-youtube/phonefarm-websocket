import { Message } from '../../domain/entities/Message.ts';
import { WebSocketConnection } from '../../domain/entities/WebSocketConnection.ts';
import { MessageType } from '../../domain/value-objects/MessageType.ts';
import { BaseMessageHandler } from './base/BaseMessageHandler.ts';
import { BroadcastMessageUseCase } from '../../application/use-cases/BroadcastMessageUseCase.ts';
import { ILogger } from '../logging/LoggerService.ts';

export class LeaveRoomHandler extends BaseMessageHandler {
  constructor(
    private readonly broadcastUseCase: BroadcastMessageUseCase,
    logger?: ILogger
  ) {
    super([MessageType.LEAVE_ROOM], logger?.child({ handler: 'LeaveRoomHandler' }));
  }

  async handle(message: Message, connection: WebSocketConnection): Promise<void> {
    const metadata = connection.getMetadata();
    const currentRoom = metadata.room;
    const username = metadata.username || 'Anonymous';
    
    this.logger.info('Processing leave room request', {
      connectionId: connection.getId(),
      currentRoom,
      username
    });
    
    if (!currentRoom) {
      this.logger.warn('Leave room failed - user not in any room', {
        connectionId: connection.getId(),
        username
      });
      await this.sendError(connection, 'Not currently in any room');
      return;
    }

    connection.updateMetadata({ room: undefined });

    await this.sendResponse(connection, MessageType.LEAVE_ROOM, {
      success: true,
      room: currentRoom,
      message: `Successfully left room: ${currentRoom}`
    });

    const leaveNotification = new Message(
      MessageType.BROADCAST,
      {
        type: 'user_left',
        room: currentRoom,
        username,
        message: `${username} left the room`
      }
    );

    await this.broadcastUseCase.executeToRoom(
      leaveNotification, 
      currentRoom, 
      connection.getId()
    );
    
    this.logger.info('User left room successfully', {
      connectionId: connection.getId(),
      room: currentRoom,
      username
    });
  }
}