import { MessageType } from '../../domain/value-objects/MessageType.ts';

export const MESSAGE_HANDLER_METADATA = Symbol('messageHandler');

export interface MessageHandlerMetadata {
  messageTypes: MessageType[];
}

export function messageHandler(...messageTypes: MessageType[]): ClassDecorator {
  return (target: any) => {
    Reflect.defineMetadata(MESSAGE_HANDLER_METADATA, {
      messageTypes
    } as MessageHandlerMetadata, target);
    
    return target;
  };
}