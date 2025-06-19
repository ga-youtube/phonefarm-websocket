import { injectable, inject } from 'tsyringe';
import winston from 'winston';
import { ILogger } from '../../domain/providers/ILogger.ts';
import { IConfigurationProvider } from '../../domain/providers/IConfigurationProvider.ts';
import { TOKENS } from '../container/tokens.ts';

@injectable()
export class LoggerService implements ILogger {
  private readonly logger: winston.Logger;

  constructor(
    @inject(TOKENS.ConfigurationProvider)
    private readonly config: IConfigurationProvider
  ) {
    const logConfig = this.config.getLogConfig();
    const appConfig = this.config.getConfig();

    this.logger = winston.createLogger({
      level: logConfig.level,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      defaultMeta: { service: logConfig.serviceName },
      transports: [
        new winston.transports.File({
          filename: logConfig.errorLogPath,
          level: 'error',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
          )
        }),
        new winston.transports.File({
          filename: logConfig.combinedLogPath,
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
          )
        })
      ]
    });

    // Add console transport for non-production environments
    if (appConfig.environment !== 'production') {
      this.logger.add(new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple(),
          winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
            const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
            return `${timestamp} [${service}] ${level}: ${message} ${metaStr}`;
          })
        )
      }));
    }
  }

  info(message: string, meta?: any): void {
    this.logger.info(message, meta);
  }

  warn(message: string, meta?: any): void {
    this.logger.warn(message, meta);
  }

  error(message: string, meta?: any): void {
    this.logger.error(message, meta);
  }

  debug(message: string, meta?: any): void {
    this.logger.debug(message, meta);
  }

  child(meta: any): ILogger {
    return new ChildLogger(this.logger.child(meta));
  }
}

class ChildLogger implements ILogger {
  constructor(private readonly logger: winston.Logger) {}

  info(message: string, meta?: any): void {
    this.logger.info(message, meta);
  }

  warn(message: string, meta?: any): void {
    this.logger.warn(message, meta);
  }

  error(message: string, meta?: any): void {
    this.logger.error(message, meta);
  }

  debug(message: string, meta?: any): void {
    this.logger.debug(message, meta);
  }

  child(meta: any): ILogger {
    return new ChildLogger(this.logger.child(meta));
  }
}