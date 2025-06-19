import { IMessageHandler } from './IMessageHandler.ts';

export type MessageHandlerConstructor = new (...args: any[]) => IMessageHandler;

export interface IHandlerDiscovery {
  discoverAndRegisterHandlers(handlerClasses: MessageHandlerConstructor[]): void;
}