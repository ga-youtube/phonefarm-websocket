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
    const messageId = id || crypto.randomUUID();
    const timestamp = this.dateProvider.now();
    return new Message(type, data, timestamp, clientId, messageId);
  }

  fromJSON(json: any): Message {
    const timestamp = json.timestamp ? this.dateProvider.parse(json.timestamp) : this.dateProvider.now();
    return new Message(
      json.type,
      json.data || {},
      timestamp,
      json.clientId,
      json.id
    );
  }
}