import { MessageType } from '../value-objects/MessageType.ts';

export interface MessageData {
  [key: string]: any;
}

export class Message {
  private readonly id: string;
  private readonly type: MessageType;
  private readonly data: MessageData;
  private readonly timestamp: Date;
  private readonly clientId?: string;

  constructor(
    type: MessageType,
    data: MessageData,
    clientId?: string,
    id?: string
  ) {
    this.id = id || crypto.randomUUID();
    this.type = type;
    this.data = data;
    this.timestamp = new Date();
    this.clientId = clientId;
  }

  getId(): string {
    return this.id;
  }

  getType(): MessageType {
    return this.type;
  }

  getData(): MessageData {
    return { ...this.data };
  }

  getTimestamp(): Date {
    return this.timestamp;
  }

  getClientId(): string | undefined {
    return this.clientId;
  }

  toJSON(): object {
    return {
      id: this.id,
      type: this.type,
      data: this.data,
      timestamp: this.timestamp,
      clientId: this.clientId
    };
  }

  static fromJSON(json: any): Message {
    return new Message(
      json.type,
      json.data,
      json.clientId,
      json.id
    );
  }
}