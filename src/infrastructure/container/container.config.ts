import { container } from 'tsyringe';
import { TOKENS } from './tokens.ts';
import { HandlerDiscovery } from './handlerDiscovery.ts';
import { IHandlerDiscovery } from '../../application/ports/IHandlerDiscovery.ts';

// Interfaces
import type { IDatabase } from '../../domain/repositories/IDatabase.ts';
import type { IConnectionRepository } from '../../domain/repositories/IConnectionRepository.ts';
import type { IDeviceRepository } from '../../domain/repositories/IDeviceRepository.ts';
import type { IDeviceStateRepository } from '../../domain/repositories/IDeviceStateRepository.ts';
import type { IRedisProvider } from '../../domain/providers/IRedisProvider.ts';
import type { IWebSocketServer } from '../../application/ports/IWebSocketServer.ts';
import type { IWebSocketAdapter } from '../../application/ports/IWebSocket.ts';
import type { IMessageHandlerRegistry } from '../../application/ports/IMessageHandler.ts';
import type { IMessageValidator } from '../../application/services/MessageDispatcher.ts';
import type { IMessageFactory } from '../../domain/factories/MessageFactory.ts';
import type { IDeviceFactory } from '../../domain/factories/DeviceFactory.ts';
import type { IDeviceStateFactory } from '../../domain/factories/DeviceStateFactory.ts';
import type { IWebSocketConnectionFactory } from '../../domain/factories/WebSocketConnectionFactory.ts';
import type { IResponseFactory } from '../../domain/factories/ResponseFactory.ts';

// Implementations
import { Database } from '../database/Database.ts';
import { ConnectionRepository } from '../websocket/ConnectionRepository.ts';
import { DeviceRepository } from '../repositories/DeviceRepository.ts';
import { DeviceStateRepository } from '../repositories/DeviceStateRepository.ts';
import { RedisProvider } from '../providers/RedisProvider.ts';
import { BunWebSocketServer } from '../websocket/BunWebSocketServer.ts';
import { BunWebSocketAdapter } from '../websocket/BunWebSocketAdapter.ts';
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
import { DeviceStateFactory } from '../../domain/factories/DeviceStateFactory.ts';
import { WebSocketConnectionFactory } from '../../domain/factories/WebSocketConnectionFactory.ts';
import { ResponseFactory } from '../../domain/factories/ResponseFactory.ts';
import { LoggerService } from '../logging/LoggerService.ts';
import { ILogger } from '../../domain/providers/ILogger.ts';
import { ConfigurationProvider } from '../providers/ConfigurationProvider.ts';
import { IConfigurationProvider } from '../../domain/providers/IConfigurationProvider.ts';

// Middleware
import { ValidationMiddleware, RateLimitMiddleware, MiddlewarePipeline } from '../../presentation/middleware/ValidationMiddleware.ts';

// Handlers
import { ChatMessageHandler } from '../handlers/ChatMessageHandler.ts';
import { JoinRoomHandler } from '../handlers/JoinRoomHandler.ts';
import { LeaveRoomHandler } from '../handlers/LeaveRoomHandler.ts';
import { DeviceInfoMessageHandler } from '../handlers/DeviceInfoMessageHandler.ts';
import { DeviceStateUpdateHandler } from '../handlers/DeviceStateUpdateHandler.ts';
import { GetDeviceStatesHandler } from '../handlers/GetDeviceStatesHandler.ts';

export function configureContainer(): void {
  // Register providers
  container.registerSingleton<IConfigurationProvider>(TOKENS.ConfigurationProvider, ConfigurationProvider);
  container.registerSingleton<IDateProvider>(TOKENS.DateProvider, DateProvider);
  container.registerSingleton<ILogger>(TOKENS.Logger, LoggerService);
  container.registerSingleton<IRedisProvider>(TOKENS.RedisProvider, RedisProvider);
  
  // Register database
  container.registerSingleton<IDatabase>(TOKENS.Database, Database);
  
  // Register factories
  container.registerSingleton<IMessageFactory>(TOKENS.MessageFactory, MessageFactory);
  container.registerSingleton<IDeviceFactory>(TOKENS.DeviceFactory, DeviceFactory);
  container.registerSingleton<IDeviceStateFactory>(TOKENS.DeviceStateFactory, DeviceStateFactory);
  container.registerSingleton<IWebSocketConnectionFactory>(TOKENS.WebSocketConnectionFactory, WebSocketConnectionFactory);
  container.registerSingleton<IResponseFactory>(TOKENS.ResponseFactory, ResponseFactory);
  
  // Register repositories
  container.registerSingleton<IConnectionRepository>(TOKENS.ConnectionRepository, ConnectionRepository);
  container.registerSingleton<IDeviceRepository>(TOKENS.DeviceRepository, DeviceRepository);
  container.registerSingleton<IDeviceStateRepository>(TOKENS.DeviceStateRepository, DeviceStateRepository);
  
  // Register infrastructure services
  container.registerSingleton<IWebSocketServer>(TOKENS.BunWebSocketServer, BunWebSocketServer);
  container.registerSingleton<IMessageHandlerRegistry>(TOKENS.MessageHandlerRegistry, MessageHandlerRegistry);
  container.registerSingleton<IMessageValidator>(TOKENS.MessageValidator, MessageValidator);
  
  // Register utilities
  container.registerSingleton<IHandlerDiscovery>(TOKENS.HandlerDiscovery, HandlerDiscovery);
  container.registerSingleton<IWebSocketAdapter>(TOKENS.WebSocketAdapter, BunWebSocketAdapter);
  
  // Register middleware
  container.register(TOKENS.ValidationMiddleware, ValidationMiddleware);
  container.register(TOKENS.RateLimitMiddleware, RateLimitMiddleware);
  container.register(TOKENS.MiddlewarePipeline, MiddlewarePipeline);
  
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
  container.register(TOKENS.DeviceStateUpdateHandler, DeviceStateUpdateHandler);
  container.register(TOKENS.GetDeviceStatesHandler, GetDeviceStatesHandler);
  
  // Auto-register handlers
  const handlerClasses = [
    ChatMessageHandler,
    JoinRoomHandler,
    LeaveRoomHandler,
    DeviceInfoMessageHandler,
    DeviceStateUpdateHandler,
    GetDeviceStatesHandler
  ];
  
  const handlerDiscovery = container.resolve<IHandlerDiscovery>(TOKENS.HandlerDiscovery);
  handlerDiscovery.discoverAndRegisterHandlers(handlerClasses);
}