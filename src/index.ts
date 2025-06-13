import { container } from './infrastructure/container/DIContainer.ts';
import { ServiceRegistry } from './infrastructure/container/ServiceRegistry.ts';
import { BunWebSocketServer } from './infrastructure/websocket/BunWebSocketServer.ts';
import { WebSocketController } from './presentation/controllers/WebSocketController.ts';

async function bootstrap(): Promise<void> {
  console.log('🚀 Starting WebSocket Server...');
  
  ServiceRegistry.register();
  ServiceRegistry.registerHandlers();
  
  const webSocketServer = container.resolve<BunWebSocketServer>('BunWebSocketServer');
  const controller = container.resolve<WebSocketController>('WebSocketController');
  
  webSocketServer.setEvents({
    onConnection: (connection) => controller.handleConnection(connection),
    onMessage: (message, connection) => controller.handleMessage(message, connection),
    onDisconnection: (connection) => controller.handleDisconnection(connection),
    onError: (error, connection) => controller.handleError(error, connection)
  });
  
  const port = parseInt(process.env.PORT || '3000');
  await webSocketServer.start(port);
  
  console.log(`✅ WebSocket Server running on ws://localhost:${port}/ws`);
}

bootstrap().catch((error) => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});