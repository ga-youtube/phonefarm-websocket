import 'reflect-metadata';
import { container } from 'tsyringe';
import { configureContainer } from './infrastructure/container/container.config.ts';
import { BunWebSocketServer } from './infrastructure/websocket/BunWebSocketServer.ts';
import { WebSocketController } from './presentation/controllers/WebSocketController.ts';
import { TOKENS } from './infrastructure/container/tokens.ts';

async function bootstrap(): Promise<void> {
  console.log('🚀 Starting WebSocket Server...');
  
  // Configure TSyringe container
  configureContainer();
  
  const webSocketServer = container.resolve<BunWebSocketServer>(TOKENS.BunWebSocketServer);
  const controller = container.resolve<WebSocketController>(TOKENS.WebSocketController);
  
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