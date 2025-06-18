import { container } from 'tsyringe';
import { TOKENS } from './tokens.ts';
import { HandlerDiscovery } from './handlerDiscovery.ts';

// Interfaces
import { IConnectionRepository } from '../../domain/repositories/IConnectionRepository.ts';
import { IDeviceRepository } from '../../domain/repositories/IDeviceRepository.ts';
import { IWebSocketServer } from '../../application/ports/IWebSocketServer.ts';
import { IMessageHandlerRegistry } from '../../application/ports/IMessageHandler.ts';
import { IMessageValidator } from '../../application/services/MessageDispatcher.ts';

// Implementations
import { ConnectionRepository } from '../websocket/ConnectionRepository.ts';
import { DeviceRepository } from '../repositories/DeviceRepository.ts';
import { BunWebSocketServer } from '../websocket/BunWebSocketServer.ts';
import { MessageHandlerRegistry } from '../handlers/MessageHandlerRegistry.ts';
import { MessageValidator } from '../validation/MessageValidator.ts';
import { BroadcastMessageUseCase } from '../../application/use-cases/BroadcastMessageUseCase.ts';
import { HandleMessageUseCase } from '../../application/use-cases/HandleMessageUseCase.ts';
import { MessageDispatcher } from '../../application/services/MessageDispatcher.ts';
import { WebSocketController } from '../../presentation/controllers/WebSocketController.ts';

// Handlers
import { ChatMessageHandler } from '../handlers/ChatMessageHandler.ts';
import { JoinRoomHandler } from '../handlers/JoinRoomHandler.ts';
import { LeaveRoomHandler } from '../handlers/LeaveRoomHandler.ts';
import { DeviceInfoMessageHandler } from '../handlers/DeviceInfoMessageHandler.ts';

export function configureContainer(): void {
  // Register repositories
  container.registerSingleton<IConnectionRepository>(TOKENS.ConnectionRepository, ConnectionRepository);
  container.registerSingleton<IDeviceRepository>(TOKENS.DeviceRepository, DeviceRepository);
  
  // Register infrastructure services
  container.registerSingleton<IWebSocketServer>(TOKENS.BunWebSocketServer, BunWebSocketServer);
  container.registerSingleton<IMessageHandlerRegistry>(TOKENS.MessageHandlerRegistry, MessageHandlerRegistry);
  container.registerSingleton<IMessageValidator>(TOKENS.MessageValidator, MessageValidator);
  
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