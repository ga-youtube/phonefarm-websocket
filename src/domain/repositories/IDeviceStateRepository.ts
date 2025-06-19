import type { DeviceStateInfo } from '../entities/DeviceStateInfo';

/**
 * Repository interface for managing device state in Redis
 */
export interface IDeviceStateRepository {
  /**
   * Update or create device state
   */
  updateState(deviceId: string, state: DeviceStateInfo): Promise<void>;

  /**
   * Get current state for a specific device
   */
  getState(deviceId: string): Promise<DeviceStateInfo | null>;

  /**
   * Get states for all devices
   */
  getAllStates(): Promise<DeviceStateInfo[]>;

  /**
   * Get states for multiple devices
   */
  getStates(deviceIds: string[]): Promise<DeviceStateInfo[]>;

  /**
   * Remove device state
   */
  removeState(deviceId: string): Promise<void>;

  /**
   * Update only specific fields of device state
   */
  updateStateFields(deviceId: string, fields: Partial<DeviceStateInfo>): Promise<void>;

  /**
   * Get devices by state
   */
  getDevicesByState(state: string): Promise<string[]>;

  /**
   * Set device as online with TTL
   */
  setOnline(deviceId: string, ttlSeconds?: number): Promise<void>;

  /**
   * Set device as offline
   */
  setOffline(deviceId: string): Promise<void>;

  /**
   * Check if device is online
   */
  isOnline(deviceId: string): Promise<boolean>;

  /**
   * Get count of online devices
   */
  getOnlineCount(): Promise<number>;

  /**
   * Get all online device IDs
   */
  getOnlineDeviceIds(): Promise<string[]>;

  /**
   * Subscribe to state changes
   */
  subscribeToStateChanges(callback: (deviceId: string, state: DeviceStateInfo) => void): Promise<void>;

  /**
   * Unsubscribe from state changes
   */
  unsubscribeFromStateChanges(): Promise<void>;

  /**
   * Publish state change event
   */
  publishStateChange(deviceId: string, state: DeviceStateInfo): Promise<void>;
}