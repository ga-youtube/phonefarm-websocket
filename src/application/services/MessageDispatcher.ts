import { injectable, inject } from 'tsyringe';
import { Message } from '../../domain/entities/Message.ts';
import { WebSocketConnection } from '../../domain/entities/WebSocketConnection.ts';
import { HandleMessageUseCase } from '../use-cases/HandleMessageUseCase.ts';
import { TOKENS } from '../../infrastructure/container/tokens.ts';

export interface MessageValidationResult {
  isValid: boolean;
  errors?: string[];
}

export interface IMessageValidator {
  validate(rawMessage: string): MessageValidationResult;
  parseMessage(rawMessage: string): Message;
}

@injectable()
export class MessageDispatcher {
  constructor(
    @inject(TOKENS.HandleMessageUseCase)
    private readonly handleMessageUseCase: HandleMessageUseCase,
    @inject(TOKENS.MessageValidator)
    private readonly messageValidator: IMessageValidator
  ) {}

  async dispatch(rawMessage: string, connection: WebSocketConnection): Promise<void> {
    try {
      const validationResult = this.messageValidator.validate(rawMessage);
      
      if (!validationResult.isValid) {
        await this.sendErrorResponse(
          connection, 
          `Validation failed: ${validationResult.errors?.join(', ')}`
        );
        return;
      }

      const message = this.messageValidator.parseMessage(rawMessage);
      await this.handleMessageUseCase.execute(message, connection);
      
    } catch (error) {
      await this.sendErrorResponse(
        connection, 
        error instanceof Error ? error.message : 'Unknown error occurred'
      );
    }
  }

  private async sendErrorResponse(connection: WebSocketConnection, errorMessage: string): Promise<void> {
    const errorResponse = JSON.stringify({
      type: 'error',
      data: { message: errorMessage },
      timestamp: new Date()
    });
    
    connection.send(errorResponse);
  }
}