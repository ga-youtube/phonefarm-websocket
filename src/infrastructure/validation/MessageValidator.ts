import { z } from 'zod';
import { Message } from '../../domain/entities/Message.ts';
import { MessageType } from '../../domain/value-objects/MessageType.ts';
import { IMessageValidator, MessageValidationResult } from '../../application/services/MessageDispatcher.ts';

const BaseMessageSchema = z.object({
  type: z.nativeEnum(MessageType),
  data: z.record(z.any()).optional().default({}),
  id: z.string().optional(),
  clientId: z.string().optional()
});

const ChatMessageSchema = z.object({
  type: z.literal(MessageType.CHAT),
  data: z.object({
    content: z.string().min(1, 'Message content cannot be empty'),
    author: z.string().optional(),
    room: z.string().optional()
  })
});

const JoinRoomSchema = z.object({
  type: z.literal(MessageType.JOIN_ROOM),
  data: z.object({
    room: z.string().min(1, 'Room name is required'),
    username: z.string().optional(),
    userId: z.string().optional()
  })
});

const LeaveRoomSchema = z.object({
  type: z.literal(MessageType.LEAVE_ROOM),
  data: z.object({}).optional()
});

const PingSchema = z.object({
  type: z.literal(MessageType.PING),
  data: z.object({}).optional()
});

export class MessageValidator implements IMessageValidator {
  private readonly schemas = new Map<MessageType, z.ZodSchema>();

  constructor() {
    this.schemas.set(MessageType.CHAT, ChatMessageSchema);
    this.schemas.set(MessageType.JOIN_ROOM, JoinRoomSchema);
    this.schemas.set(MessageType.LEAVE_ROOM, LeaveRoomSchema);
    this.schemas.set(MessageType.PING, PingSchema);
  }

  validate(rawMessage: string): MessageValidationResult {
    try {
      const parsedMessage = JSON.parse(rawMessage);
      
      const baseValidation = BaseMessageSchema.safeParse(parsedMessage);
      if (!baseValidation.success) {
        return {
          isValid: false,
          errors: baseValidation.error.errors.map(err => 
            `${err.path.join('.')}: ${err.message}`
          )
        };
      }

      const messageType = baseValidation.data.type;
      const specificSchema = this.schemas.get(messageType);
      
      if (specificSchema) {
        const specificValidation = specificSchema.safeParse(parsedMessage);
        if (!specificValidation.success) {
          return {
            isValid: false,
            errors: specificValidation.error.errors.map(err => 
              `${err.path.join('.')}: ${err.message}`
            )
          };
        }
      }

      return { isValid: true };
      
    } catch (error) {
      return {
        isValid: false,
        errors: ['Invalid JSON format']
      };
    }
  }

  parseMessage(rawMessage: string): Message {
    const parsedMessage = JSON.parse(rawMessage);
    
    return new Message(
      parsedMessage.type,
      parsedMessage.data || {},
      parsedMessage.clientId,
      parsedMessage.id
    );
  }

  addSchema(messageType: MessageType, schema: z.ZodSchema): void {
    this.schemas.set(messageType, schema);
  }
}