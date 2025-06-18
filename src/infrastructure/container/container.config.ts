import { container } from 'tsyringe';
import { TOKENS } from './tokens.ts';
import { HandlerDiscovery } from './handlerDiscovery.ts';

// Interfaces
import type { IDatabase } from '../../domain/repositories/IDatabase.ts';
import type { IConnectionRepository } from '../../domain/repositories/IConnectionRepository.ts';
import type { IDeviceRepository } from '../../domain/repositories/IDeviceRepository.ts';
import type { IWebSocketServer } from '../../application/ports/IWebSocketServer.ts';
import type { IMessageHandlerRegistry } from '../../application/ports/IMessageHandler.ts';
import type { IMessageValidator } from '../../application/services/MessageDispatcher.ts';
import type { IMessageFactory } from '../../domain/factories/MessageFactory.ts';
import type { IDeviceFactory } from '../../domain/factories/DeviceFactory.ts';
import type { IWebSocketConnectionFactory } from '../../domain/factories/WebSocketConnectionFactory.ts';

// Implementations
import { Database } from '../database/Database.ts';
import { ConnectionRepository } from '../websocket/ConnectionRepository.ts';
import { DeviceRepository } from '../repositories/DeviceRepository.ts';
import { BunWebSocketServer } from '../websocket/BunWebSocketServer.ts';
import { MessageHandlerRegistry } from '../handlers/MessageHandlerRegistry.ts';
import { MessageValidator } from '../validation/MessageValidator.ts';
import { BroadcastMessageUseCase } from '../../application/use-cases/BroadcastMessageUseCase.ts';
import { HandleMessageUseCase } from '../../application/use-cases/HandleMessageUseCase.ts';
import { MessageDispatcher } from '../../application/services/MessageDispatcher.ts';
import { WebSocketController } from '../../presentation/controllers/WebSocketController.ts';
import { DateProvider } from '../providers/DateProvider.ts';
import { IDateProvider } from '../../domain/providers/IDateProvider.ts';
import { MessageFactory } from '../../domain/factories/MessageFactory.ts';
import { DeviceFactory } from '../../domain/factories/DeviceFactory.ts';
import { WebSocketConnectionFactory } from '../../domain/factories/WebSocketConnectionFactory.ts';

// Middleware
import { ValidationMiddleware, RateLimitMiddleware, MiddlewarePipeline } from '../../presentation/middleware/ValidationMiddleware.ts';

// Handlers
import { ChatMessageHandler } from '../handlers/ChatMessageHandler.ts';
import { JoinRoomHandler } from '../handlers/JoinRoomHandler.ts';
import { LeaveRoomHandler } from '../handlers/LeaveRoomHandler.ts';
import { DeviceInfoMessageHandler } from '../handlers/DeviceInfoMessageHandler.ts';

export function configureContainer(): void {
  // Register providers
  container.registerSingleton<IDateProvider>(TOKENS.DateProvider, DateProvider);
  
  // Register database
  container.registerSingleton<IDatabase>(TOKENS.Database, Database);
  
  // Register factories
  container.registerSingleton<IMessageFactory>(TOKENS.MessageFactory, MessageFactory);
  container.registerSingleton<IDeviceFactory>(TOKENS.DeviceFactory, DeviceFactory);
  container.registerSingleton<IWebSocketConnectionFactory>(TOKENS.WebSocketConnectionFactory, WebSocketConnectionFactory);
  
  // Register repositories
  container.registerSingleton<IConnectionRepository>(TOKENS.ConnectionRepository, ConnectionRepository);
  container.registerSingleton<IDeviceRepository>(TOKENS.DeviceRepository, DeviceRepository);
  
  // Register infrastructure services
  container.registerSingleton<IWebSocketServer>(TOKENS.BunWebSocketServer, BunWebSocketServer);
  container.registerSingleton<IMessageHandlerRegistry>(TOKENS.MessageHandlerRegistry, MessageHandlerRegistry);
  container.registerSingleton<IMessageValidator>(TOKENS.MessageValidator, MessageValidator);
  
  // Register middleware
  container.register('ValidationMiddleware', ValidationMiddleware);
  container.register('RateLimitMiddleware', RateLimitMiddleware);
  container.register('MiddlewarePipeline', MiddlewarePipeline);
  
  // Register use cases
  container.registerSingleton(TOKENS.BroadcastMessageUseCase, BroadcastMessageUseCase);
  container.registerSingleton(TOKENS.HandleMessageUseCase, HandleMessageUseCase);
  
  // Register application services
  container.registerSingleton(TOKENS.MessageDispatcher, MessageDispatcher);
  
  // Register controllers
  container.registerSingleton(TOKENS.WebSocketController, WebSocketController);
  
  // Register message handlers
  container.register(TOKENS.ChatMessageHandler, ChatMessageHandler);
  container.register(TOKENS.JoinRoomHandler, JoinRoomHandler);
  container.register(TOKENS.LeaveRoomHandler, LeaveRoomHandler);
  container.register(TOKENS.DeviceInfoMessageHandler, DeviceInfoMessageHandler);
  
  // Auto-register handlers
  const handlerClasses = [
    ChatMessageHandler,
    JoinRoomHandler,
    LeaveRoomHandler,
    DeviceInfoMessageHandler
  ];
  
  HandlerDiscovery.discoverAndRegisterHandlers(handlerClasses);
}