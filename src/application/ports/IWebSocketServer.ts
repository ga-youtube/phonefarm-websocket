import { WebSocketConnection } from '../../domain/entities/WebSocketConnection.ts';

export interface IWebSocketServer {
  start(port: number): Promise<void>;
  stop(): Promise<void>;
  broadcast(message: string, excludeConnectionId?: string): Promise<void>;
  broadcastToRoom(room: string, message: string, excludeConnectionId?: string): Promise<void>;
  getConnection(connectionId: string): Promise<WebSocketConnection | null>;
  getConnections(): Promise<WebSocketConnection[]>;
  isRunning(): boolean;
}

export interface WebSocketServerEvents {
  onConnection?: (connection: WebSocketConnection) => void;
  onMessage?: (message: string, connection: WebSocketConnection) => void;
  onDisconnection?: (connection: WebSocketConnection) => void;
  onError?: (error: Error, connection?: WebSocketConnection) => void;
}