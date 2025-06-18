import { injectable } from 'tsyringe';
import { WebSocketConnection } from '../../domain/entities/WebSocketConnection.ts';
import type { IConnectionRepository } from '../../domain/repositories/IConnectionRepository.ts';

@injectable()
export class ConnectionRepository implements IConnectionRepository {
  private readonly connections = new Map<string, WebSocketConnection>();

  async add(connection: WebSocketConnection): Promise<void> {
    this.connections.set(connection.getId(), connection);
  }

  async remove(connectionId: string): Promise<void> {
    const connection = this.connections.get(connectionId);
    if (connection) {
      connection.close();
      this.connections.delete(connectionId);
    }
  }

  async findById(connectionId: string): Promise<WebSocketConnection | null> {
    return this.connections.get(connectionId) || null;
  }

  async findByRoom(room: string): Promise<WebSocketConnection[]> {
    const roomConnections: WebSocketConnection[] = [];
    
    for (const connection of this.connections.values()) {
      const metadata = connection.getMetadata();
      if (metadata.room === room && connection.isConnected()) {
        roomConnections.push(connection);
      }
    }
    
    return roomConnections;
  }

  async findByUserId(userId: string): Promise<WebSocketConnection[]> {
    const userConnections: WebSocketConnection[] = [];
    
    for (const connection of this.connections.values()) {
      const metadata = connection.getMetadata();
      if (metadata.userId === userId && connection.isConnected()) {
        userConnections.push(connection);
      }
    }
    
    return userConnections;
  }

  async getAll(): Promise<WebSocketConnection[]> {
    return Array.from(this.connections.values());
  }

  async getConnectedCount(): Promise<number> {
    let count = 0;
    for (const connection of this.connections.values()) {
      if (connection.isConnected()) {
        count++;
      }
    }
    return count;
  }
}