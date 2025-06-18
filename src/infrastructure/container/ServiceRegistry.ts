import { container } from './DIContainer.ts';
import { ConnectionRepository } from '../websocket/ConnectionRepository.ts';
import { BunWebSocketServer } from '../websocket/BunWebSocketServer.ts';
import { MessageHandlerRegistry } from '../handlers/MessageHandlerRegistry.ts';
import { ChatMessageHandler } from '../handlers/ChatMessageHandler.ts';
import { JoinRoomHandler } from '../handlers/JoinRoomHandler.ts';
import { LeaveRoomHandler } from '../handlers/LeaveRoomHandler.ts';
import { DeviceInfoMessageHandler } from '../handlers/DeviceInfoMessageHandler.ts';
import { DeviceRepository } from '../repositories/DeviceRepository.ts';
import { MessageValidator } from '../validation/MessageValidator.ts';
import { HandleMessageUseCase } from '../../application/use-cases/HandleMessageUseCase.ts';
import { BroadcastMessageUseCase } from '../../application/use-cases/BroadcastMessageUseCase.ts';
import { MessageDispatcher } from '../../application/services/MessageDispatcher.ts';
import { WebSocketController } from '../../presentation/controllers/WebSocketController.ts';
import { IConnectionRepository } from '../../domain/repositories/IConnectionRepository.ts';
import { IDeviceRepository } from '../../domain/repositories/IDeviceRepository.ts';
import { IWebSocketServer } from '../../application/ports/IWebSocketServer.ts';
import { IMessageHandlerRegistry } from '../../application/ports/IMessageHandler.ts';

export class ServiceRegistry {
  static register(): void {
    container.registerSingleton('ConnectionRepository', () => new ConnectionRepository());
    
    container.registerSingleton('DeviceRepository', () => new DeviceRepository());
    
    container.registerSingleton('BunWebSocketServer', () => {
      const connectionRepository = container.resolve<IConnectionRepository>('ConnectionRepository');
      return new BunWebSocketServer(connectionRepository);
    });

    container.registerSingleton('MessageHandlerRegistry', () => new MessageHandlerRegistry());
    
    container.registerSingleton('MessageValidator', () => new MessageValidator());

    container.registerSingleton('BroadcastMessageUseCase', () => {
      const connectionRepository = container.resolve<IConnectionRepository>('ConnectionRepository');
      const webSocketServer = container.resolve<IWebSocketServer>('BunWebSocketServer');
      return new BroadcastMessageUseCase(connectionRepository, webSocketServer);
    });

    container.registerSingleton('HandleMessageUseCase', () => {
      const handlerRegistry = container.resolve<IMessageHandlerRegistry>('MessageHandlerRegistry');
      return new HandleMessageUseCase(handlerRegistry);
    });

    container.registerSingleton('MessageDispatcher', () => {
      const handleMessageUseCase = container.resolve<HandleMessageUseCase>('HandleMessageUseCase');
      const messageValidator = container.resolve<MessageValidator>('MessageValidator');
      return new MessageDispatcher(handleMessageUseCase, messageValidator);
    });

    container.registerSingleton('WebSocketController', () => {
      const messageDispatcher = container.resolve<MessageDispatcher>('MessageDispatcher');
      return new WebSocketController(messageDispatcher);
    });

    container.registerTransient('ChatMessageHandler', () => {
      const broadcastUseCase = container.resolve<BroadcastMessageUseCase>('BroadcastMessageUseCase');
      return new ChatMessageHandler(broadcastUseCase);
    });

    container.registerTransient('JoinRoomHandler', () => {
      const broadcastUseCase = container.resolve<BroadcastMessageUseCase>('BroadcastMessageUseCase');
      return new JoinRoomHandler(broadcastUseCase);
    });

    container.registerTransient('LeaveRoomHandler', () => {
      const broadcastUseCase = container.resolve<BroadcastMessageUseCase>('BroadcastMessageUseCase');
      return new LeaveRoomHandler(broadcastUseCase);
    });

    container.registerTransient('DeviceInfoMessageHandler', () => {
      const deviceRepository = container.resolve<IDeviceRepository>('DeviceRepository');
      return new DeviceInfoMessageHandler(deviceRepository);
    });
  }

  static registerHandlers(): void {
    const handlerRegistry = container.resolve<IMessageHandlerRegistry>('MessageHandlerRegistry');
    
    handlerRegistry.register(container.resolve<ChatMessageHandler>('ChatMessageHandler'));
    handlerRegistry.register(container.resolve<JoinRoomHandler>('JoinRoomHandler'));
    handlerRegistry.register(container.resolve<LeaveRoomHandler>('LeaveRoomHandler'));
    handlerRegistry.register(container.resolve<DeviceInfoMessageHandler>('DeviceInfoMessageHandler'));
  }
}