import 'reflect-metadata';
import { container } from 'tsyringe';
import { configureContainer } from './infrastructure/container/container.config.ts';
import { BunWebSocketServer } from './infrastructure/websocket/BunWebSocketServer.ts';
import { WebSocketController } from './presentation/controllers/WebSocketController.ts';
import { TOKENS } from './infrastructure/container/tokens.ts';
import { ILogger } from './domain/providers/ILogger.ts';
import { IConfigurationProvider } from './domain/providers/IConfigurationProvider.ts';

async function bootstrap(): Promise<void> {
  // Configure TSyringe container
  configureContainer();
  
  const logger = container.resolve<ILogger>(TOKENS.Logger);
  const config = container.resolve<IConfigurationProvider>(TOKENS.ConfigurationProvider);
  
  logger.info('Starting WebSocket Server...');
  
  const webSocketServer = container.resolve<BunWebSocketServer>(TOKENS.BunWebSocketServer);
  const controller = container.resolve<WebSocketController>(TOKENS.WebSocketController);
  
  webSocketServer.setEvents({
    onConnection: (connection) => controller.handleConnection(connection),
    onMessage: (message, connection) => controller.handleMessage(message, connection),
    onDisconnection: (connection) => controller.handleDisconnection(connection),
    onError: (error, connection) => controller.handleError(error, connection)
  });
  
  const serverConfig = config.getServerConfig();
  await webSocketServer.start(serverConfig.port);
  
  logger.info('WebSocket Server started successfully', {
    port: serverConfig.port,
    url: `ws://${serverConfig.host}:${serverConfig.port}${serverConfig.wsEndpoint}`
  });
}

bootstrap().catch((error) => {
  // Use console.error as logger might not be initialized yet
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});