import { injectable, inject } from 'tsyringe';
import { z } from 'zod';
import { Message } from '../../domain/entities/Message.ts';
import { MessageType } from '../../domain/value-objects/MessageType.ts';
import type { IMessageValidator, MessageValidationResult } from '../../application/services/MessageDispatcher.ts';
import type { IMessageFactory } from '../../domain/factories/MessageFactory.ts';
import { TOKENS } from '../container/tokens.ts';
import { ApplicationConstants } from '../../domain/constants/ApplicationConstants.ts';

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

const DeviceInfoSchema = z.object({
  type: z.literal(MessageType.DEVICE_INFO),
  data: z.object({
    serial: z.string().min(1, 'Device serial is required'),
    imei: z.string().regex(ApplicationConstants.IMEI_REGEX, 'IMEI must be 15-16 digits').optional(),
    macAddress: z.string().regex(ApplicationConstants.MAC_ADDRESS_REGEX, 'Invalid MAC address format').optional(),
    wifiIpAddress: z.string().ip('Invalid IP address format').optional(),
    brand: z.string().min(1, 'Device brand is required'),
    model: z.string().min(1, 'Device model is required'),
    release: z.string().min(1, 'Android release is required'),
    sdkInt: z.number().int().min(1, 'Android SDK int must be a positive integer')
  })
});

const DeviceStateUpdateSchema = z.object({
  type: z.literal(MessageType.DEVICE_STATE_UPDATE),
  data: z.object({
    deviceId: z.string().min(1, 'Device ID is required'),
    serial: z.string().min(1, 'Device serial is required'),
    state: z.string().min(1, 'State is required'),
    batteryLevel: z.number().min(0).max(100).optional(),
    temperature: z.number().optional(),
    cpuUsage: z.number().min(0).max(100).optional(),
    memoryUsage: z.number().min(0).max(100).optional(),
    storageUsage: z.number().min(0).max(100).optional(),
    metadata: z.record(z.any()).optional()
  })
});

const GetDeviceStatesSchema = z.object({
  type: z.literal(MessageType.GET_DEVICE_STATES),
  data: z.object({
    deviceIds: z.array(z.string()).optional(),
    state: z.string().optional(),
    includeMetrics: z.boolean().optional().default(true)
  }).optional()
});

@injectable()
export class MessageValidator implements IMessageValidator {
  private readonly schemas = new Map<MessageType, z.ZodSchema>();

  constructor(
    @inject(TOKENS.MessageFactory)
    private readonly messageFactory: IMessageFactory
  ) {
    this.schemas.set(MessageType.CHAT, ChatMessageSchema);
    this.schemas.set(MessageType.JOIN_ROOM, JoinRoomSchema);
    this.schemas.set(MessageType.LEAVE_ROOM, LeaveRoomSchema);
    this.schemas.set(MessageType.PING, PingSchema);
    this.schemas.set(MessageType.DEVICE_INFO, DeviceInfoSchema);
    this.schemas.set(MessageType.DEVICE_STATE_UPDATE, DeviceStateUpdateSchema);
    this.schemas.set(MessageType.GET_DEVICE_STATES, GetDeviceStatesSchema);
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
    
    return this.messageFactory.create(
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