import { injectable, inject } from 'tsyringe';
import { MessageType } from '../value-objects/MessageType.ts';
import { IDateProvider } from '../providers/IDateProvider.ts';
import { TOKENS } from '../../infrastructure/container/tokens.ts';
import { ApplicationError, ValidationError } from '../errors/ApplicationError.ts';

export interface IResponseFactory {
  createSuccessResponse(type: MessageType, data: any, clientId?: string): string;
  createErrorResponse(error: Error | ApplicationError, clientId?: string): string;
  createWelcomeResponse(connectionId: string): string;
}

@injectable()
export class ResponseFactory implements IResponseFactory {
  constructor(
    @inject(TOKENS.DateProvider)
    private readonly dateProvider: IDateProvider
  ) {}

  createSuccessResponse(type: MessageType, data: any, clientId?: string): string {
    return JSON.stringify({
      type,
      data,
      timestamp: this.dateProvider.now(),
      ...(clientId && { clientId })
    });
  }

  createErrorResponse(error: Error | ApplicationError, clientId?: string): string {
    const isApplicationError = error instanceof ApplicationError;
    
    return JSON.stringify({
      type: MessageType.ERROR,
      data: {
        message: isApplicationError && error.isOperational ? error.message : 'Internal server error',
        code: isApplicationError ? error.code : 'INTERNAL_ERROR',
        ...(isApplicationError && error instanceof ValidationError && { errors: error.errors })
      },
      timestamp: this.dateProvider.now(),
      ...(clientId && { clientId })
    });
  }

  createWelcomeResponse(connectionId: string): string {
    return JSON.stringify({
      type: 'welcome',
      data: {
        connectionId,
        message: 'Connected to WebSocket server',
        timestamp: this.dateProvider.now()
      }
    });
  }
}