export abstract class ApplicationError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, code: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends ApplicationError {
  constructor(message: string, public readonly errors: string[] = []) {
    super(message, 'VALIDATION_ERROR', 400);
  }
}

export class NotFoundError extends ApplicationError {
  constructor(message: string) {
    super(message, 'NOT_FOUND', 404);
  }
}

export class UnauthorizedError extends ApplicationError {
  constructor(message: string = 'Unauthorized') {
    super(message, 'UNAUTHORIZED', 401);
  }
}

export class ConfigurationError extends ApplicationError {
  constructor(message: string) {
    super(message, 'CONFIGURATION_ERROR', 500, false);
  }
}

export class ConnectionError extends ApplicationError {
  constructor(message: string) {
    super(message, 'CONNECTION_ERROR', 503);
  }
}

export class MessageHandlingError extends ApplicationError {
  constructor(message: string, public readonly messageType?: string) {
    super(message, 'MESSAGE_HANDLING_ERROR', 400);
  }
}