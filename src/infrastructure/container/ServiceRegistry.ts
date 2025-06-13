import { container } from './DIContainer.ts';
import { ConnectionRepository } from '../websocket/ConnectionRepository.ts';
import { BunWebSocketServer } from '../websocket/BunWebSocketServer.ts';
import { MessageHandlerRegistry } from '../handlers/MessageHandlerRegistry.ts';
import { ChatMessageHandler } from '../handlers/ChatMessageHandler.ts';
import { JoinRoomHandler } from '../handlers/JoinRoomHandler.ts';
import { LeaveRoomHandler } from '../handlers/LeaveRoomHandler.ts';
import { MessageValidator } from '../validation/MessageValidator.ts';
import { LoggerService, ILogger } from '../logging/LoggerService.ts';
import { HandleMessageUseCase } from '../../application/use-cases/HandleMessageUseCase.ts';
import { BroadcastMessageUseCase } from '../../application/use-cases/BroadcastMessageUseCase.ts';
import { MessageDispatcher } from '../../application/services/MessageDispatcher.ts';
import { WebSocketController } from '../../presentation/controllers/WebSocketController.ts';
import { IConnectionRepository } from '../../domain/repositories/IConnectionRepository.ts';
import { IWebSocketServer } from '../../application/ports/IWebSocketServer.ts';
import { IMessageHandlerRegistry } from '../../application/ports/IMessageHandler.ts';

export class ServiceRegistry {
  static register(): void {
    container.registerSingleton('Logger', () => new LoggerService());
    
    container.registerSingleton('ConnectionRepository', () => new ConnectionRepository());
    
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
      const logger = container.resolve<ILogger>('Logger');
      return new WebSocketController(messageDispatcher, logger);
    });

    container.registerTransient('ChatMessageHandler', () => {
      const broadcastUseCase = container.resolve<BroadcastMessageUseCase>('BroadcastMessageUseCase');
      const logger = container.resolve<ILogger>('Logger');
      return new ChatMessageHandler(broadcastUseCase, logger);
    });

    container.registerTransient('JoinRoomHandler', () => {
      const broadcastUseCase = container.resolve<BroadcastMessageUseCase>('BroadcastMessageUseCase');
      const logger = container.resolve<ILogger>('Logger');
      return new JoinRoomHandler(broadcastUseCase, logger);
    });

    container.registerTransient('LeaveRoomHandler', () => {
      const broadcastUseCase = container.resolve<BroadcastMessageUseCase>('BroadcastMessageUseCase');
      const logger = container.resolve<ILogger>('Logger');
      return new LeaveRoomHandler(broadcastUseCase, logger);
    });
  }

  static registerHandlers(): void {
    const handlerRegistry = container.resolve<IMessageHandlerRegistry>('MessageHandlerRegistry');
    
    handlerRegistry.register(container.resolve<ChatMessageHandler>('ChatMessageHandler'));
    handlerRegistry.register(container.resolve<JoinRoomHandler>('JoinRoomHandler'));
    handlerRegistry.register(container.resolve<LeaveRoomHandler>('LeaveRoomHandler'));
  }
}