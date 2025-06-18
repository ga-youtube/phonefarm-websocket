import { injectable } from 'tsyringe';
import { Message, MessageData } from '@/domain/entities/Message';
import { MessageType } from '@/domain/value-objects/MessageType';

export interface IMessageFactory {
  create(type: MessageType, data: MessageData, clientId?: string, id?: string): Message;
  fromJSON(json: any): Message;
}

@injectable()
export class MessageFactory implements IMessageFactory {
  create(type: MessageType, data: MessageData, clientId?: string, id?: string): Message {
    return new Message(type, data, clientId, id);
  }

  fromJSON(json: any): Message {
    return new Message(
      json.type,
      json.data || {},
      json.clientId,
      json.id
    );
  }
}