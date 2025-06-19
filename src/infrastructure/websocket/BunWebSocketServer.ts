import { injectable, inject } from 'tsyringe';
import { WebSocketConnection, ConnectionStatus } from '../../domain/entities/WebSocketConnection.ts';
import type { IConnectionRepository } from '../../domain/repositories/IConnectionRepository.ts';
import type { IWebSocketServer, WebSocketServerEvents } from '../../application/ports/IWebSocketServer.ts';
import type { IWebSocketConnectionFactory } from '../../domain/factories/WebSocketConnectionFactory.ts';
import type { ILogger } from '../../domain/providers/ILogger.ts';
import type { IConfigurationProvider } from '../../domain/providers/IConfigurationProvider.ts';
import type { IWebSocketAdapter } from '../../application/ports/IWebSocket.ts';
import type { BunServer, BunWebSocket } from './types/BunTypes.ts';
import { TOKENS } from '../container/tokens.ts';

@injectable()
export class BunWebSocketServer implements IWebSocketServer {
  private server: BunServer | null = null;
  private running = false;
  private events: WebSocketServerEvents = {};
  private wsToConnectionMap = new WeakMap<BunWebSocket, string>();

  constructor(
    @inject(TOKENS.ConnectionRepository)
    private readonly connectionRepository: IConnectionRepository,
    @inject(TOKENS.WebSocketConnectionFactory)
    private readonly connectionFactory: IWebSocketConnectionFactory,
    @inject(TOKENS.Logger)
    private readonly logger: ILogger,
    @inject(TOKENS.ConfigurationProvider)
    private readonly config: IConfigurationProvider,
    @inject(TOKENS.WebSocketAdapter)
    private readonly wsAdapter: IWebSocketAdapter
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
    }) as unknown as BunServer;

    this.running = true;
    this.logger.info('WebSocket server started', { port });
  }

  async stop(): Promise<void> {
    if (this.server) {
      this.server.stop();
      this.server = null;
      this.running = false;
      this.logger.info('WebSocket server stopped');
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

  private handleFetch(req: Request): Response | undefined {
    const url = new URL(req.url);
    const serverConfig = this.config.getServerConfig();
    
    if (url.pathname === serverConfig.wsEndpoint) {
      const upgraded = this.server!.upgrade(req);
      if (upgraded) {
        return undefined;
      }
    }
    
    return new Response(`WebSocket endpoint available at ${serverConfig.wsEndpoint}`, { status: 404 });
  }

  private async handleOpen(ws: BunWebSocket): Promise<void> {
    const wrappedWs = this.wsAdapter.adapt(ws);
    const connection = this.connectionFactory.create(wrappedWs);
    connection.setStatus(ConnectionStatus.CONNECTED);
    
    // Map raw WebSocket to connection ID for fast lookup
    this.wsToConnectionMap.set(ws, connection.getId());
    
    await this.connectionRepository.add(connection);
    
    if (this.events.onConnection) {
      this.events.onConnection(connection);
    }
  }

  private async handleMessage(ws: BunWebSocket, message: string): Promise<void> {
    const connectionId = this.wsToConnectionMap.get(ws);
    if (!connectionId) return;
    
    const connection = await this.connectionRepository.findById(connectionId);
    if (connection && this.events.onMessage) {
      this.events.onMessage(message, connection);
    }
  }

  private async handleClose(ws: BunWebSocket): Promise<void> {
    const connectionId = this.wsToConnectionMap.get(ws);
    if (!connectionId) return;
    
    const connection = await this.connectionRepository.findById(connectionId);
    if (connection) {
      connection.setStatus(ConnectionStatus.DISCONNECTED);
      await this.connectionRepository.remove(connection.getId());
      
      // Clean up the mapping
      this.wsToConnectionMap.delete(ws);
      
      if (this.events.onDisconnection) {
        this.events.onDisconnection(connection);
      }
    }
  }

}