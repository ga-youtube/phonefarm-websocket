import { injectable, inject } from 'tsyringe';
import { WebSocketConnection, ConnectionStatus } from '../../domain/entities/WebSocketConnection.ts';
import { IConnectionRepository } from '../../domain/repositories/IConnectionRepository.ts';
import { IWebSocketServer, WebSocketServerEvents } from '../../application/ports/IWebSocketServer.ts';
import { TOKENS } from '../container/tokens.ts';

@injectable()
export class BunWebSocketServer implements IWebSocketServer {
  private server: any;
  private running = false;
  private events: WebSocketServerEvents = {};

  constructor(
    @inject(TOKENS.ConnectionRepository)
    private readonly connectionRepository: IConnectionRepository
  ) {}

  setEvents(events: WebSocketServerEvents): void {
    this.events = events;
  }

  async start(port: number): Promise<void> {
    this.server = Bun.serve({
      port,
      fetch: this.handleFetch.bind(this),
      websocket: {
        message: this.handleMessage.bind(this),
        open: this.handleOpen.bind(this),
        close: this.handleClose.bind(this)
      }
    });

    this.running = true;
    console.log(`WebSocket server started on port ${port}`);
  }

  async stop(): Promise<void> {
    if (this.server) {
      this.server.stop();
      this.running = false;
      console.log('WebSocket server stopped');
    }
  }

  async broadcast(message: string, excludeConnectionId?: string): Promise<void> {
    const connections = await this.connectionRepository.getAll();
    
    for (const connection of connections) {
      if (connection.isConnected() && connection.getId() !== excludeConnectionId) {
        connection.send(message);
      }
    }
  }

  async broadcastToRoom(room: string, message: string, excludeConnectionId?: string): Promise<void> {
    const connections = await this.connectionRepository.findByRoom(room);
    
    for (const connection of connections) {
      if (connection.isConnected() && connection.getId() !== excludeConnectionId) {
        connection.send(message);
      }
    }
  }

  async getConnection(connectionId: string): Promise<WebSocketConnection | null> {
    return await this.connectionRepository.findById(connectionId);
  }

  async getConnections(): Promise<WebSocketConnection[]> {
    return await this.connectionRepository.getAll();
  }

  isRunning(): boolean {
    return this.running;
  }

  private handleFetch(req: Request): Response | Promise<Response> {
    const url = new URL(req.url);
    
    if (url.pathname === '/ws') {
      const upgraded = this.server.upgrade(req);
      if (upgraded) {
        return undefined as any;
      }
    }
    
    return new Response('WebSocket endpoint available at /ws', { status: 404 });
  }

  private async handleOpen(ws: any): Promise<void> {
    const connection = new WebSocketConnection(ws);
    connection.setStatus(ConnectionStatus.CONNECTED);
    
    await this.connectionRepository.add(connection);
    
    if (this.events.onConnection) {
      this.events.onConnection(connection);
    }
  }

  private async handleMessage(ws: any, message: string): Promise<void> {
    const connections = await this.connectionRepository.getAll();
    const connection = connections.find(conn => conn.getWebSocket() === ws);
    
    if (connection && this.events.onMessage) {
      this.events.onMessage(message, connection);
    }
  }

  private async handleClose(ws: any): Promise<void> {
    const connections = await this.connectionRepository.getAll();
    const connection = connections.find(conn => conn.getWebSocket() === ws);
    
    if (connection) {
      connection.setStatus(ConnectionStatus.DISCONNECTED);
      await this.connectionRepository.remove(connection.getId());
      
      if (this.events.onDisconnection) {
        this.events.onDisconnection(connection);
      }
    }
  }

}