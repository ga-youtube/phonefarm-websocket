import { injectable, inject } from 'tsyringe';
import Redis, { Redis as RedisClient } from 'ioredis';
import type { IRedisProvider } from '../../domain/providers/IRedisProvider.ts';
import type { ILogger } from '../../domain/providers/ILogger.ts';
import type { IConfigurationProvider } from '../../domain/providers/IConfigurationProvider.ts';
import { TOKENS } from '../container/tokens.ts';

@injectable()
export class RedisProvider implements IRedisProvider {
  private client: RedisClient;
  private pubClient: RedisClient;
  private subClient: RedisClient;
  private readonly logger: ILogger;
  private isConnected: boolean = false;

  constructor(
    @inject(TOKENS.Logger) logger: ILogger,
    @inject(TOKENS.ConfigurationProvider) configProvider: IConfigurationProvider
  ) {
    this.logger = logger.child({ service: 'RedisProvider' });
    
    const password = configProvider.get('REDIS_PASSWORD');
    const redisConfig = {
      host: String(configProvider.get('REDIS_HOST') || 'localhost'),
      port: parseInt(configProvider.get('REDIS_PORT') || '6379'),
      password: password ? String(password) : undefined,
      db: parseInt(configProvider.get('REDIS_DB') || '0'),
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000);
        this.logger.warn(`Redis connection retry attempt ${times}, delay: ${delay}ms`);
        return delay;
      }
    };

    // Main client for general operations
    this.client = new Redis(redisConfig);
    
    // Separate clients for pub/sub to avoid blocking
    this.pubClient = new Redis(redisConfig);
    this.subClient = new Redis(redisConfig);

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.client.on('connect', () => {
      this.isConnected = true;
      this.logger.info('Redis client connected');
    });

    this.client.on('error', (error) => {
      this.logger.error('Redis client error', { error: error.message });
    });

    this.client.on('close', () => {
      this.isConnected = false;
      this.logger.warn('Redis client connection closed');
    });

    // Setup handlers for pub/sub clients
    this.pubClient.on('error', (error) => {
      this.logger.error('Redis pub client error', { error: error.message });
    });

    this.subClient.on('error', (error) => {
      this.logger.error('Redis sub client error', { error: error.message });
    });
  }

  async get(key: string): Promise<string | null> {
    try {
      const value = await this.client.get(key);
      return value;
    } catch (error) {
      this.logger.error('Redis get error', { key, error });
      throw error;
    }
  }

  async set(key: string, value: string, expirationSeconds?: number): Promise<void> {
    try {
      if (expirationSeconds) {
        await this.client.setex(key, expirationSeconds, value);
      } else {
        await this.client.set(key, value);
      }
    } catch (error) {
      this.logger.error('Redis set error', { key, error });
      throw error;
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch (error) {
      this.logger.error('Redis del error', { key, error });
      throw error;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      this.logger.error('Redis exists error', { key, error });
      throw error;
    }
  }

  async expire(key: string, seconds: number): Promise<void> {
    try {
      await this.client.expire(key, seconds);
    } catch (error) {
      this.logger.error('Redis expire error', { key, seconds, error });
      throw error;
    }
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    try {
      const result = await this.client.hgetall(key);
      return result || {};
    } catch (error) {
      this.logger.error('Redis hgetall error', { key, error });
      throw error;
    }
  }

  async hget(key: string, field: string): Promise<string | null> {
    try {
      const value = await this.client.hget(key, field);
      return value;
    } catch (error) {
      this.logger.error('Redis hget error', { key, field, error });
      throw error;
    }
  }

  async hset(key: string, field: string, value: string): Promise<void> {
    try {
      await this.client.hset(key, field, value);
    } catch (error) {
      this.logger.error('Redis hset error', { key, field, error });
      throw error;
    }
  }

  async hmset(key: string, data: Record<string, string>): Promise<void> {
    try {
      const args: string[] = [];
      for (const [field, value] of Object.entries(data)) {
        args.push(field, value);
      }
      await this.client.hmset(key, ...args);
    } catch (error) {
      this.logger.error('Redis hmset error', { key, error });
      throw error;
    }
  }

  async hdel(key: string, field: string): Promise<void> {
    try {
      await this.client.hdel(key, field);
    } catch (error) {
      this.logger.error('Redis hdel error', { key, field, error });
      throw error;
    }
  }

  async keys(pattern: string): Promise<string[]> {
    try {
      const keys = await this.client.keys(pattern);
      return keys;
    } catch (error) {
      this.logger.error('Redis keys error', { pattern, error });
      throw error;
    }
  }

  async sadd(key: string, ...members: string[]): Promise<number> {
    try {
      const result = await this.client.sadd(key, ...members);
      return result;
    } catch (error) {
      this.logger.error('Redis sadd error', { key, members, error });
      throw error;
    }
  }

  async srem(key: string, ...members: string[]): Promise<number> {
    try {
      const result = await this.client.srem(key, ...members);
      return result;
    } catch (error) {
      this.logger.error('Redis srem error', { key, members, error });
      throw error;
    }
  }

  async smembers(key: string): Promise<string[]> {
    try {
      const members = await this.client.smembers(key);
      return members;
    } catch (error) {
      this.logger.error('Redis smembers error', { key, error });
      throw error;
    }
  }

  async sismember(key: string, member: string): Promise<boolean> {
    try {
      const result = await this.client.sismember(key, member);
      return result === 1;
    } catch (error) {
      this.logger.error('Redis sismember error', { key, member, error });
      throw error;
    }
  }

  async publish(channel: string, message: string): Promise<number> {
    try {
      const result = await this.pubClient.publish(channel, message);
      return result;
    } catch (error) {
      this.logger.error('Redis publish error', { channel, error });
      throw error;
    }
  }

  async subscribe(channel: string, callback: (message: string) => void): Promise<void> {
    try {
      await this.subClient.subscribe(channel);
      
      this.subClient.on('message', (receivedChannel, message) => {
        if (receivedChannel === channel) {
          callback(message);
        }
      });
    } catch (error) {
      this.logger.error('Redis subscribe error', { channel, error });
      throw error;
    }
  }

  async unsubscribe(channel: string): Promise<void> {
    try {
      await this.subClient.unsubscribe(channel);
    } catch (error) {
      this.logger.error('Redis unsubscribe error', { channel, error });
      throw error;
    }
  }

  async close(): Promise<void> {
    try {
      await Promise.all([
        this.client.quit(),
        this.pubClient.quit(),
        this.subClient.quit()
      ]);
      this.isConnected = false;
      this.logger.info('Redis connections closed');
    } catch (error) {
      this.logger.error('Redis close error', { error });
      throw error;
    }
  }

  isReady(): boolean {
    return this.isConnected && this.client.status === 'ready';
  }
}