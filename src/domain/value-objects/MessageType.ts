export enum MessageType {
  CHAT = 'chat',
  JOIN_ROOM = 'join_room',
  LEAVE_ROOM = 'leave_room',
  BROADCAST = 'broadcast',
  PING = 'ping',
  PONG = 'pong',
  ERROR = 'error',
  DEVICE_INFO = 'device_info'
}

export class MessageTypeVO {
  constructor(private readonly value: MessageType) {
    this.validate();
  }

  private validate(): void {
    if (!Object.values(MessageType).includes(this.value)) {
      throw new Error(`Invalid message type: ${this.value}`);
    }
  }

  getValue(): MessageType {
    return this.value;
  }

  equals(other: MessageTypeVO): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}