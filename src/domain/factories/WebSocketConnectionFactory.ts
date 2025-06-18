import { injectable } from 'tsyringe';
import { WebSocketConnection, ConnectionMetadata } from '@/domain/entities/WebSocketConnection';

export interface IWebSocketConnectionFactory {
  create(websocket: any, id?: string, metadata?: ConnectionMetadata): WebSocketConnection;
}

@injectable()
export class WebSocketConnectionFactory implements IWebSocketConnectionFactory {
  create(websocket: any, id?: string, metadata: ConnectionMetadata = {}): WebSocketConnection {
    return new WebSocketConnection(websocket, id, metadata);
  }
}