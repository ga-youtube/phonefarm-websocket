import { injectable, inject } from 'tsyringe';
import { WebSocketConnection, ConnectionMetadata } from '@/domain/entities/WebSocketConnection';
import { IDateProvider } from '@/domain/providers/IDateProvider';
import { IWebSocket } from '@/application/ports/IWebSocket';
import { TOKENS } from '@/infrastructure/container/tokens';

export interface IWebSocketConnectionFactory {
  create(websocket: IWebSocket, id?: string, metadata?: ConnectionMetadata): WebSocketConnection;
}

@injectable()
export class WebSocketConnectionFactory implements IWebSocketConnectionFactory {
  constructor(
    @inject(TOKENS.DateProvider)
    private readonly dateProvider: IDateProvider
  ) {}
  
  create(websocket: IWebSocket, id?: string, metadata: ConnectionMetadata = {}): WebSocketConnection {
    const connectionId = id || crypto.randomUUID();
    const connectedAt = this.dateProvider.now();
    
    // Extract IP address from websocket if available
    if (websocket.remoteAddress && !metadata.ipAddress) {
      metadata.ipAddress = websocket.remoteAddress;
    }
    
    return new WebSocketConnection(websocket, connectedAt, connectionId, metadata);
  }
}