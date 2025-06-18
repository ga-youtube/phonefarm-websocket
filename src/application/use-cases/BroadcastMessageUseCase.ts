import { injectable, inject } from 'tsyringe';
import { Message } from '../../domain/entities/Message.ts';
import type { IConnectionRepository } from '../../domain/repositories/IConnectionRepository.ts';
import type { IWebSocketServer } from '../ports/IWebSocketServer.ts';
import { TOKENS } from '../../infrastructure/container/tokens.ts';

@injectable()
export class BroadcastMessageUseCase {
  constructor(
    @inject(TOKENS.ConnectionRepository)
    private readonly connectionRepository: IConnectionRepository,
    @inject(TOKENS.BunWebSocketServer)
    private readonly webSocketServer: IWebSocketServer
  ) {}

  async execute(message: Message, excludeConnectionId?: string): Promise<void> {
    const messageString = JSON.stringify(message.toJSON());
    await this.webSocketServer.broadcast(messageString, excludeConnectionId);
  }

  async executeToRoom(
    message: Message, 
    room: string, 
    excludeConnectionId?: string
  ): Promise<void> {
    const messageString = JSON.stringify(message.toJSON());
    await this.webSocketServer.broadcastToRoom(room, messageString, excludeConnectionId);
  }

  async executeToUser(
    message: Message, 
    userId: string
  ): Promise<void> {
    const connections = await this.connectionRepository.findByUserId(userId);
    const messageString = JSON.stringify(message.toJSON());
    
    for (const connection of connections) {
      if (connection.isConnected()) {
        connection.send(messageString);
      }
    }
  }
}