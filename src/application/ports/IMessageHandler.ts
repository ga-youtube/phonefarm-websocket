import { Message } from '../../domain/entities/Message.ts';
import { WebSocketConnection } from '../../domain/entities/WebSocketConnection.ts';

export interface IMessageHandler {
  canHandle(messageType: string): boolean;
  handle(message: Message, connection: WebSocketConnection): Promise<void>;
}

export interface IMessageHandlerRegistry {
  register(handler: IMessageHandler): void;
  getHandler(messageType: string): IMessageHandler | null;
  getAllHandlers(): IMessageHandler[];
}