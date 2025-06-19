import { injectable, inject } from 'tsyringe';
import type { IDeviceStateRepository } from '../../domain/repositories/IDeviceStateRepository.ts';
import type { IRedisProvider } from '../../domain/providers/IRedisProvider.ts';
import type { ILogger } from '../../domain/providers/ILogger.ts';
import { DeviceStateInfo } from '../../domain/entities/DeviceStateInfo.ts';
import { DeviceState } from '../../domain/value-objects/DeviceState.ts';
import { TOKENS } from '../container/tokens.ts';

@injectable()
export class DeviceStateRepository implements IDeviceStateRepository {
  private readonly STATES_KEY_PREFIX = 'device:state:';
  private readonly ONLINE_SET_KEY = 'devices:online';
  private readonly STATE_INDEX_PREFIX = 'devices:by-state:';
  private readonly STATE_CHANNEL = 'device:state:changes';
  private readonly DEFAULT_TTL = 300; // 5 minutes
  private readonly logger: ILogger;

  constructor(
    @inject(TOKENS.RedisProvider) private readonly redis: IRedisProvider,
    @inject(TOKENS.Logger) logger: ILogger
  ) {
    this.logger = logger.child({ repository: 'DeviceStateRepository' });
  }

  async updateState(deviceId: string, state: DeviceStateInfo): Promise<void> {
    try {
      const key = this.getStateKey(deviceId);
      const hash = state.toRedisHash();
      
      // Update state hash
      await this.redis.hmset(key, hash);
      
      // Set TTL to prevent stale data
      await this.redis.expire(key, this.DEFAULT_TTL);
      
      // Update online set if needed
      if (state.getState().isOnline()) {
        await this.redis.sadd(this.ONLINE_SET_KEY, deviceId);
      } else {
        await this.redis.srem(this.ONLINE_SET_KEY, deviceId);
      }
      
      // Update state indexes
      await this.updateStateIndexes(deviceId, state.getStateValue());
      
      // Publish state change event
      await this.publishStateChange(deviceId, state);
      
      this.logger.info('Device state updated', {
        deviceId,
        state: state.getStateValue(),
        batteryLevel: state.getBatteryLevel()
      });
    } catch (error) {
      this.logger.error('Failed to update device state', { deviceId, error });
      throw error;
    }
  }

  async getState(deviceId: string): Promise<DeviceStateInfo | null> {
    try {
      const key = this.getStateKey(deviceId);
      const hash = await this.redis.hgetall(key);
      
      if (!hash || Object.keys(hash).length === 0) {
        return null;
      }
      
      return DeviceStateInfo.fromRedisHash(hash);
    } catch (error) {
      this.logger.error('Failed to get device state', { deviceId, error });
      throw error;
    }
  }

  async getAllStates(): Promise<DeviceStateInfo[]> {
    try {
      const pattern = `${this.STATES_KEY_PREFIX}*`;
      const keys = await this.redis.keys(pattern);
      
      const states: DeviceStateInfo[] = [];
      
      for (const key of keys) {
        const hash = await this.redis.hgetall(key);
        if (hash && Object.keys(hash).length > 0) {
          try {
            states.push(DeviceStateInfo.fromRedisHash(hash));
          } catch (error) {
            this.logger.warn('Failed to parse device state', { key, error });
          }
        }
      }
      
      return states;
    } catch (error) {
      this.logger.error('Failed to get all device states', { error });
      throw error;
    }
  }

  async getStates(deviceIds: string[]): Promise<DeviceStateInfo[]> {
    try {
      const states: DeviceStateInfo[] = [];
      
      for (const deviceId of deviceIds) {
        const state = await this.getState(deviceId);
        if (state) {
          states.push(state);
        }
      }
      
      return states;
    } catch (error) {
      this.logger.error('Failed to get device states', { deviceIds, error });
      throw error;
    }
  }

  async removeState(deviceId: string): Promise<void> {
    try {
      const key = this.getStateKey(deviceId);
      
      // Get current state to clean up indexes
      const state = await this.getState(deviceId);
      if (state) {
        await this.removeFromStateIndexes(deviceId, state.getStateValue());
      }
      
      // Remove from online set
      await this.redis.srem(this.ONLINE_SET_KEY, deviceId);
      
      // Delete state hash
      await this.redis.del(key);
      
      this.logger.info('Device state removed', { deviceId });
    } catch (error) {
      this.logger.error('Failed to remove device state', { deviceId, error });
      throw error;
    }
  }

  async updateStateFields(deviceId: string, fields: Partial<DeviceStateInfo>): Promise<void> {
    try {
      const currentState = await this.getState(deviceId);
      if (!currentState) {
        throw new Error(`Device state not found for device: ${deviceId}`);
      }
      
      const updatedState = currentState.withUpdates({
        ...fields,
        lastUpdated: new Date()
      });
      
      await this.updateState(deviceId, updatedState);
    } catch (error) {
      this.logger.error('Failed to update device state fields', { deviceId, fields, error });
      throw error;
    }
  }

  async getDevicesByState(state: string): Promise<string[]> {
    try {
      const key = `${this.STATE_INDEX_PREFIX}${state}`;
      return await this.redis.smembers(key);
    } catch (error) {
      this.logger.error('Failed to get devices by state', { state, error });
      throw error;
    }
  }

  async setOnline(deviceId: string, ttlSeconds?: number): Promise<void> {
    try {
      const state = await this.getState(deviceId);
      const newState = state ? state.withUpdates({
        state: DeviceState.ONLINE,
        lastUpdated: new Date()
      }) : new DeviceStateInfo({
        deviceId,
        serial: deviceId, // Fallback if no existing state
        state: DeviceState.ONLINE,
        lastUpdated: new Date()
      });
      
      await this.updateState(deviceId, newState);
      
      // Set custom TTL if provided
      if (ttlSeconds) {
        const key = this.getStateKey(deviceId);
        await this.redis.expire(key, ttlSeconds);
      }
    } catch (error) {
      this.logger.error('Failed to set device online', { deviceId, error });
      throw error;
    }
  }

  async setOffline(deviceId: string): Promise<void> {
    try {
      const state = await this.getState(deviceId);
      if (state) {
        const newState = state.withUpdates({
          state: DeviceState.OFFLINE,
          lastUpdated: new Date()
        });
        await this.updateState(deviceId, newState);
      }
    } catch (error) {
      this.logger.error('Failed to set device offline', { deviceId, error });
      throw error;
    }
  }

  async isOnline(deviceId: string): Promise<boolean> {
    try {
      return await this.redis.sismember(this.ONLINE_SET_KEY, deviceId);
    } catch (error) {
      this.logger.error('Failed to check if device is online', { deviceId, error });
      throw error;
    }
  }

  async getOnlineCount(): Promise<number> {
    try {
      const members = await this.redis.smembers(this.ONLINE_SET_KEY);
      return members.length;
    } catch (error) {
      this.logger.error('Failed to get online device count', { error });
      throw error;
    }
  }

  async getOnlineDeviceIds(): Promise<string[]> {
    try {
      return await this.redis.smembers(this.ONLINE_SET_KEY);
    } catch (error) {
      this.logger.error('Failed to get online device IDs', { error });
      throw error;
    }
  }

  async subscribeToStateChanges(callback: (deviceId: string, state: DeviceStateInfo) => void): Promise<void> {
    try {
      await this.redis.subscribe(this.STATE_CHANNEL, (message) => {
        try {
          const data = JSON.parse(message);
          const state = new DeviceStateInfo(data.state);
          callback(data.deviceId, state);
        } catch (error) {
          this.logger.error('Failed to parse state change message', { error });
        }
      });
    } catch (error) {
      this.logger.error('Failed to subscribe to state changes', { error });
      throw error;
    }
  }

  async unsubscribeFromStateChanges(): Promise<void> {
    try {
      await this.redis.unsubscribe(this.STATE_CHANNEL);
    } catch (error) {
      this.logger.error('Failed to unsubscribe from state changes', { error });
      throw error;
    }
  }

  async publishStateChange(deviceId: string, state: DeviceStateInfo): Promise<void> {
    try {
      const message = JSON.stringify({
        deviceId,
        state: state.toJSON(),
        timestamp: new Date().toISOString()
      });
      
      await this.redis.publish(this.STATE_CHANNEL, message);
    } catch (error) {
      this.logger.error('Failed to publish state change', { deviceId, error });
      // Don't throw here to avoid breaking state updates
    }
  }

  private getStateKey(deviceId: string): string {
    return `${this.STATES_KEY_PREFIX}${deviceId}`;
  }

  private async updateStateIndexes(deviceId: string, newState: DeviceState): Promise<void> {
    try {
      // Remove from all state indexes
      const allStates = Object.values(DeviceState);
      for (const state of allStates) {
        const key = `${this.STATE_INDEX_PREFIX}${state}`;
        await this.redis.srem(key, deviceId);
      }
      
      // Add to new state index
      const newKey = `${this.STATE_INDEX_PREFIX}${newState}`;
      await this.redis.sadd(newKey, deviceId);
    } catch (error) {
      this.logger.error('Failed to update state indexes', { deviceId, newState, error });
    }
  }

  private async removeFromStateIndexes(deviceId: string, state: DeviceState): Promise<void> {
    try {
      const key = `${this.STATE_INDEX_PREFIX}${state}`;
      await this.redis.srem(key, deviceId);
    } catch (error) {
      this.logger.error('Failed to remove from state indexes', { deviceId, state, error });
    }
  }
}