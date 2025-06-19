import { IWebSocket } from '../../application/ports/IWebSocket.ts';

export enum ConnectionStatus {
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  ERROR = 'error'
}

export interface ConnectionMetadata {
  userAgent?: string;
  ipAddress?: string;
  room?: string;
  userId?: string;
  username?: string;
  [key: string]: any;
}

export class WebSocketConnection {
  private readonly id: string;
  private status: ConnectionStatus;
  private readonly connectedAt: Date;
  private disconnectedAt?: Date;
  private metadata: ConnectionMetadata;
  private readonly websocket: IWebSocket;

  constructor(
    websocket: IWebSocket,
    connectedAt: Date,
    id?: string,
    metadata: ConnectionMetadata = {}
  ) {
    this.id = id || '';  // ID should be provided by factory
    this.websocket = websocket;
    this.status = ConnectionStatus.CONNECTING;
    this.connectedAt = connectedAt;
    this.metadata = metadata;
  }

  getId(): string {
    return this.id;
  }

  getStatus(): ConnectionStatus {
    return this.status;
  }

  getConnectedAt(): Date {
    return this.connectedAt;
  }

  getDisconnectedAt(): Date | undefined {
    return this.disconnectedAt;
  }

  getMetadata(): ConnectionMetadata {
    return { ...this.metadata };
  }

  getWebSocket(): IWebSocket {
    return this.websocket;
  }

  getRemoteAddress(): string {
    return this.metadata.ipAddress || 'unknown';
  }

  setStatus(status: ConnectionStatus): void {
    this.status = status;
    if (status === ConnectionStatus.DISCONNECTED) {
      this.disconnectedAt = new Date();
    }
  }

  updateMetadata(metadata: Partial<ConnectionMetadata>): void {
    this.metadata = { ...this.metadata, ...metadata };
  }

  isConnected(): boolean {
    return this.status === ConnectionStatus.CONNECTED;
  }

  send(message: string): void {
    if (this.isConnected()) {
      this.websocket.send(message);
    }
  }

  close(): void {
    if (this.websocket) {
      this.websocket.close();
    }
    this.setStatus(ConnectionStatus.DISCONNECTED);
  }
}