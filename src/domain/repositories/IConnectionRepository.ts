import { WebSocketConnection } from '../entities/WebSocketConnection.ts';

export interface IConnectionRepository {
  add(connection: WebSocketConnection): Promise<void>;
  remove(connectionId: string): Promise<void>;
  findById(connectionId: string): Promise<WebSocketConnection | null>;
  findByRoom(room: string): Promise<WebSocketConnection[]>;
  findByUserId(userId: string): Promise<WebSocketConnection[]>;
  getAll(): Promise<WebSocketConnection[]>;
  getConnectedCount(): Promise<number>;
}