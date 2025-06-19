import { injectable } from 'tsyringe';
import { z } from 'zod';
import { 
  IConfigurationProvider, 
  IApplicationConfig,
  IServerConfig,
  IDatabaseConfig,
  ILogConfig 
} from '../../domain/providers/IConfigurationProvider.ts';
import { ApplicationConstants } from '../../domain/constants/ApplicationConstants.ts';

const ConfigSchema = z.object({
  environment: z.enum(['development', 'production', 'test']).default('development'),
  server: z.object({
    port: z.number().int().positive().default(ApplicationConstants.DEFAULT_PORT),
    host: z.string().default(ApplicationConstants.DEFAULT_HOST),
    wsEndpoint: z.string().default(ApplicationConstants.DEFAULT_WS_ENDPOINT)
  }),
  database: z.object({
    url: z.string().url().or(z.string().startsWith('postgresql://')),
    maxConnections: z.number().int().positive().default(ApplicationConstants.DEFAULT_DB_MAX_CONNECTIONS),
    idleTimeoutMs: z.number().int().positive().default(ApplicationConstants.DEFAULT_DB_IDLE_TIMEOUT_MS),
    connectionTimeoutMs: z.number().int().positive().default(ApplicationConstants.DEFAULT_DB_CONNECTION_TIMEOUT_MS)
  }),
  logging: z.object({
    level: z.enum(['error', 'warn', 'info', 'debug']).default(ApplicationConstants.DEFAULT_LOG_LEVEL as any),
    errorLogPath: z.string().default(ApplicationConstants.DEFAULT_LOG_ERROR_PATH),
    combinedLogPath: z.string().default(ApplicationConstants.DEFAULT_LOG_COMBINED_PATH),
    serviceName: z.string().default(ApplicationConstants.DEFAULT_SERVICE_NAME)
  })
});

@injectable()
export class ConfigurationProvider implements IConfigurationProvider {
  private config: IApplicationConfig;

  constructor() {
    this.config = this.loadConfiguration();
    this.validate();
  }

  private loadConfiguration(): IApplicationConfig {
    const rawConfig = {
      environment: process.env.NODE_ENV || 'development',
      server: {
        port: parseInt(process.env.PORT || process.env.WS_PORT || String(ApplicationConstants.DEFAULT_PORT)),
        host: process.env.HOST || process.env.WS_HOST || ApplicationConstants.DEFAULT_HOST,
        wsEndpoint: process.env.WS_ENDPOINT || ApplicationConstants.DEFAULT_WS_ENDPOINT
      },
      database: {
        url: process.env.DATABASE_URL || '',
        maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || String(ApplicationConstants.DEFAULT_DB_MAX_CONNECTIONS)),
        idleTimeoutMs: parseInt(process.env.DB_IDLE_TIMEOUT_MS || String(ApplicationConstants.DEFAULT_DB_IDLE_TIMEOUT_MS)),
        connectionTimeoutMs: parseInt(process.env.DB_CONNECTION_TIMEOUT_MS || String(ApplicationConstants.DEFAULT_DB_CONNECTION_TIMEOUT_MS))
      },
      logging: {
        level: process.env.LOG_LEVEL || ApplicationConstants.DEFAULT_LOG_LEVEL,
        errorLogPath: process.env.LOG_ERROR_PATH || ApplicationConstants.DEFAULT_LOG_ERROR_PATH,
        combinedLogPath: process.env.LOG_COMBINED_PATH || ApplicationConstants.DEFAULT_LOG_COMBINED_PATH,
        serviceName: process.env.SERVICE_NAME || ApplicationConstants.DEFAULT_SERVICE_NAME
      }
    };

    return ConfigSchema.parse(rawConfig);
  }

  getConfig(): IApplicationConfig {
    return this.config;
  }

  get<T>(key: string): T {
    const keys = key.split('.');
    let value: any = this.config;

    for (const k of keys) {
      value = value[k];
      if (value === undefined) {
        throw new Error(`Configuration key not found: ${key}`);
      }
    }

    return value as T;
  }

  getServerConfig(): IServerConfig {
    return this.config.server;
  }

  getDatabaseConfig(): IDatabaseConfig {
    return this.config.database;
  }

  getLogConfig(): ILogConfig {
    return this.config.logging;
  }

  validate(): void {
    if (!this.config.database.url) {
      throw new Error('DATABASE_URL environment variable is required');
    }
  }
}