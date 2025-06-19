export interface IServerConfig {
  port: number;
  host: string;
  wsEndpoint: string;
}

export interface IDatabaseConfig {
  url: string;
  maxConnections: number;
  idleTimeoutMs: number;
  connectionTimeoutMs: number;
}

export interface ILogConfig {
  level: string;
  errorLogPath: string;
  combinedLogPath: string;
  serviceName: string;
}

export interface IApplicationConfig {
  environment: 'development' | 'production' | 'test';
  server: IServerConfig;
  database: IDatabaseConfig;
  logging: ILogConfig;
}

export interface IConfigurationProvider {
  getConfig(): IApplicationConfig;
  get<T>(key: string): T;
  getServerConfig(): IServerConfig;
  getDatabaseConfig(): IDatabaseConfig;
  getLogConfig(): ILogConfig;
  validate(): void;
}