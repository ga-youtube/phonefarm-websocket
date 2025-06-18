import { injectable } from 'tsyringe';
import { WebSocketConnection } from '../../domain/entities/WebSocketConnection.ts';

export interface MiddlewareResult {
  success: boolean;
  error?: string;
}

export interface IMiddleware {
  execute(rawMessage: string, connection: WebSocketConnection): Promise<MiddlewareResult>;
}

@injectable()
export class ValidationMiddleware implements IMiddleware {
  async execute(rawMessage: string, connection: WebSocketConnection): Promise<MiddlewareResult> {
    if (!rawMessage || rawMessage.trim() === '') {
      return {
        success: false,
        error: 'Empty message received'
      };
    }

    try {
      JSON.parse(rawMessage);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: 'Invalid JSON format'
      };
    }
  }
}

@injectable()
export class RateLimitMiddleware implements IMiddleware {
  private readonly messageCount = new Map<string, { count: number; lastReset: number }>();
  private readonly maxMessagesPerMinute: number;
  private readonly windowMs: number;

  constructor(maxMessagesPerMinute = 60, windowMs = 60000) {
    this.maxMessagesPerMinute = maxMessagesPerMinute;
    this.windowMs = windowMs;
  }

  async execute(rawMessage: string, connection: WebSocketConnection): Promise<MiddlewareResult> {
    const connectionId = connection.getId();
    const now = Date.now();
    
    const record = this.messageCount.get(connectionId) || { count: 0, lastReset: now };
    
    if (now - record.lastReset > this.windowMs) {
      record.count = 0;
      record.lastReset = now;
    }
    
    record.count++;
    this.messageCount.set(connectionId, record);
    
    if (record.count > this.maxMessagesPerMinute) {
      return {
        success: false,
        error: 'Rate limit exceeded'
      };
    }
    
    return { success: true };
  }
}

@injectable()
export class MiddlewarePipeline {
  private readonly middlewares: IMiddleware[] = [];

  add(middleware: IMiddleware): void {
    this.middlewares.push(middleware);
  }

  async execute(rawMessage: string, connection: WebSocketConnection): Promise<MiddlewareResult> {
    for (const middleware of this.middlewares) {
      const result = await middleware.execute(rawMessage, connection);
      if (!result.success) {
        return result;
      }
    }
    
    return { success: true };
  }
}