import { injectable, inject } from 'tsyringe';
import { WebSocketConnection, ConnectionMetadata } from '@/domain/entities/WebSocketConnection';
import { IDateProvider } from '@/domain/providers/IDateProvider';
import { TOKENS } from '@/infrastructure/container/tokens';

export interface IWebSocketConnectionFactory {
  create(websocket: any, id?: string, metadata?: ConnectionMetadata): WebSocketConnection;
}

@injectable()
export class WebSocketConnectionFactory implements IWebSocketConnectionFactory {
  constructor(
    @inject(TOKENS.DateProvider)
    private readonly dateProvider: IDateProvider
  ) {}
  create(websocket: any, id?: string, metadata: ConnectionMetadata = {}): WebSocketConnection {
    return new WebSocketConnection(websocket, id, metadata);
  }
}