import { Message } from '../../../domain/entities/Message.ts';
import { WebSocketConnection } from '../../../domain/entities/WebSocketConnection.ts';
import { IMessageHandler } from '../../../application/ports/IMessageHandler.ts';
import { MessageType } from '../../../domain/value-objects/MessageType.ts';
import { ILogger } from '../../logging/LoggerService.ts';

export abstract class BaseMessageHandler implements IMessageHandler {
  protected readonly supportedMessageTypes: MessageType[];
  protected readonly logger: ILogger;

  constructor(supportedMessageTypes: MessageType[], logger?: ILogger) {
    this.supportedMessageTypes = supportedMessageTypes;
    // Create a mock logger if none provided to avoid breaking existing handlers
    this.logger = logger || {
      info: () => {},
      warn: () => {},
      error: () => {},
      debug: () => {},
      child: () => this.logger
    } as ILogger;
  }

  canHandle(messageType: string): boolean {
    return this.supportedMessageTypes.includes(messageType as MessageType);
  }

  abstract handle(message: Message, connection: WebSocketConnection): Promise<void>;

  protected async sendResponse(
    connection: WebSocketConnection, 
    type: MessageType, 
    data: any
  ): Promise<void> {
    const response = new Message(type, data);
    const responseString = JSON.stringify(response.toJSON());
    connection.send(responseString);
  }

  protected async sendError(
    connection: WebSocketConnection, 
    errorMessage: string
  ): Promise<void> {
    await this.sendResponse(connection, MessageType.ERROR, { 
      message: errorMessage 
    });
  }

  protected validateRequiredFields(data: any, requiredFields: string[]): string[] {
    const errors: string[] = [];
    
    for (const field of requiredFields) {
      if (!(field in data) || data[field] === undefined || data[field] === null) {
        errors.push(`Missing required field: ${field}`);
      }
    }
    
    return errors;
  }
}