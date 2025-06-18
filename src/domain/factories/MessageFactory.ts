import { injectable, inject } from 'tsyringe';
import { Message, MessageData } from '@/domain/entities/Message';
import { MessageType } from '@/domain/value-objects/MessageType';
import { IDateProvider } from '@/domain/providers/IDateProvider';
import { TOKENS } from '@/infrastructure/container/tokens';

export interface IMessageFactory {
  create(type: MessageType, data: MessageData, clientId?: string, id?: string): Message;
  fromJSON(json: any): Message;
}

@injectable()
export class MessageFactory implements IMessageFactory {
  constructor(
    @inject(TOKENS.DateProvider)
    private readonly dateProvider: IDateProvider
  ) {}
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