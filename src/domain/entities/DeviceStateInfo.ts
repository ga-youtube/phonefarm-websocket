import { DeviceState, DeviceStateVO } from '../value-objects/DeviceState.ts';

export interface DeviceStateData {
  deviceId: string;
  serial: string;
  state: DeviceState | string;
  batteryLevel?: number;
  temperature?: number;
  cpuUsage?: number;
  memoryUsage?: number;
  storageUsage?: number;
  lastUpdated: Date;
  metadata?: Record<string, any>;
}

/**
 * Device state information entity
 */
export class DeviceStateInfo {
  private readonly deviceId: string;
  private readonly serial: string;
  private readonly state: DeviceStateVO;
  private readonly batteryLevel?: number;
  private readonly temperature?: number;
  private readonly cpuUsage?: number;
  private readonly memoryUsage?: number;
  private readonly storageUsage?: number;
  private readonly lastUpdated: Date;
  private readonly metadata: Record<string, any>;

  constructor(data: DeviceStateData) {
    this.validateData(data);

    this.deviceId = data.deviceId;
    this.serial = data.serial;
    this.state = new DeviceStateVO(data.state);
    this.batteryLevel = data.batteryLevel;
    this.temperature = data.temperature;
    this.cpuUsage = data.cpuUsage;
    this.memoryUsage = data.memoryUsage;
    this.storageUsage = data.storageUsage;
    this.lastUpdated = data.lastUpdated;
    this.metadata = data.metadata || {};
  }

  private validateData(data: DeviceStateData): void {
    if (!data.deviceId?.trim()) {
      throw new Error('Device ID is required');
    }

    if (!data.serial?.trim()) {
      throw new Error('Device serial is required');
    }

    if (!data.state) {
      throw new Error('Device state is required');
    }

    if (!data.lastUpdated || !(data.lastUpdated instanceof Date)) {
      throw new Error('Last updated date is required and must be a Date object');
    }

    // Validate numeric fields if provided
    if (data.batteryLevel !== undefined) {
      if (typeof data.batteryLevel !== 'number' || data.batteryLevel < 0 || data.batteryLevel > 100) {
        throw new Error('Battery level must be a number between 0 and 100');
      }
    }

    if (data.temperature !== undefined) {
      if (typeof data.temperature !== 'number' || data.temperature < -50 || data.temperature > 100) {
        throw new Error('Temperature must be a reasonable number');
      }
    }

    if (data.cpuUsage !== undefined) {
      if (typeof data.cpuUsage !== 'number' || data.cpuUsage < 0 || data.cpuUsage > 100) {
        throw new Error('CPU usage must be a number between 0 and 100');
      }
    }

    if (data.memoryUsage !== undefined) {
      if (typeof data.memoryUsage !== 'number' || data.memoryUsage < 0 || data.memoryUsage > 100) {
        throw new Error('Memory usage must be a number between 0 and 100');
      }
    }

    if (data.storageUsage !== undefined) {
      if (typeof data.storageUsage !== 'number' || data.storageUsage < 0 || data.storageUsage > 100) {
        throw new Error('Storage usage must be a number between 0 and 100');
      }
    }
  }

  getDeviceId(): string {
    return this.deviceId;
  }

  getSerial(): string {
    return this.serial;
  }

  getState(): DeviceStateVO {
    return this.state;
  }

  getStateValue(): DeviceState {
    return this.state.getValue();
  }

  getBatteryLevel(): number | undefined {
    return this.batteryLevel;
  }

  getTemperature(): number | undefined {
    return this.temperature;
  }

  getCpuUsage(): number | undefined {
    return this.cpuUsage;
  }

  getMemoryUsage(): number | undefined {
    return this.memoryUsage;
  }

  getStorageUsage(): number | undefined {
    return this.storageUsage;
  }

  getLastUpdated(): Date {
    return this.lastUpdated;
  }

  getMetadata(): Record<string, any> {
    return { ...this.metadata };
  }

  getMetadataValue(key: string): any {
    return this.metadata[key];
  }

  /**
   * Check if state info is stale (older than specified seconds)
   */
  isStale(maxAgeSeconds: number): boolean {
    const ageMs = Date.now() - this.lastUpdated.getTime();
    return ageMs > maxAgeSeconds * 1000;
  }

  /**
   * Check if device needs attention based on state and metrics
   */
  needsAttention(): boolean {
    // Check critical states
    if (this.state.isError()) {
      return true;
    }

    // Check battery
    if (this.batteryLevel !== undefined && this.batteryLevel < 20) {
      return true;
    }

    // Check temperature
    if (this.temperature !== undefined && (this.temperature > 70 || this.temperature < 0)) {
      return true;
    }

    // Check resource usage
    if (this.cpuUsage !== undefined && this.cpuUsage > 90) {
      return true;
    }

    if (this.memoryUsage !== undefined && this.memoryUsage > 90) {
      return true;
    }

    if (this.storageUsage !== undefined && this.storageUsage > 95) {
      return true;
    }

    return false;
  }

  /**
   * Get health score (0-100)
   */
  getHealthScore(): number {
    let score = 100;

    // Deduct for state
    if (this.state.isError()) {
      score -= 50;
    } else if (this.state.isOffline()) {
      score -= 30;
    } else if (this.state.getValue() === DeviceState.BATTERY_CRITICAL) {
      score -= 40;
    } else if (this.state.getValue() === DeviceState.BATTERY_LOW) {
      score -= 20;
    }

    // Deduct for battery
    if (this.batteryLevel !== undefined) {
      if (this.batteryLevel < 10) score -= 20;
      else if (this.batteryLevel < 20) score -= 10;
      else if (this.batteryLevel < 30) score -= 5;
    }

    // Deduct for temperature
    if (this.temperature !== undefined) {
      if (this.temperature > 80) score -= 20;
      else if (this.temperature > 70) score -= 10;
      else if (this.temperature > 60) score -= 5;
    }

    // Deduct for resource usage
    if (this.cpuUsage !== undefined && this.cpuUsage > 80) {
      score -= Math.floor((this.cpuUsage - 80) / 2);
    }

    if (this.memoryUsage !== undefined && this.memoryUsage > 80) {
      score -= Math.floor((this.memoryUsage - 80) / 2);
    }

    if (this.storageUsage !== undefined && this.storageUsage > 90) {
      score -= Math.floor((this.storageUsage - 90));
    }

    return Math.max(0, score);
  }

  /**
   * Create a new instance with updated fields
   */
  withUpdates(updates: Partial<DeviceStateData>): DeviceStateInfo {
    return new DeviceStateInfo({
      deviceId: this.deviceId,
      serial: this.serial,
      state: updates.state ?? this.state.getValue(),
      batteryLevel: updates.batteryLevel ?? this.batteryLevel,
      temperature: updates.temperature ?? this.temperature,
      cpuUsage: updates.cpuUsage ?? this.cpuUsage,
      memoryUsage: updates.memoryUsage ?? this.memoryUsage,
      storageUsage: updates.storageUsage ?? this.storageUsage,
      lastUpdated: updates.lastUpdated ?? new Date(),
      metadata: updates.metadata ?? this.metadata
    });
  }

  toJSON(): DeviceStateData {
    return {
      deviceId: this.deviceId,
      serial: this.serial,
      state: this.state.getValue(),
      batteryLevel: this.batteryLevel,
      temperature: this.temperature,
      cpuUsage: this.cpuUsage,
      memoryUsage: this.memoryUsage,
      storageUsage: this.storageUsage,
      lastUpdated: this.lastUpdated,
      metadata: this.metadata
    };
  }

  /**
   * Convert to Redis-friendly format
   */
  toRedisHash(): Record<string, string> {
    const hash: Record<string, string> = {
      deviceId: this.deviceId,
      serial: this.serial,
      state: this.state.getValue(),
      lastUpdated: this.lastUpdated.toISOString()
    };

    if (this.batteryLevel !== undefined) {
      hash.batteryLevel = this.batteryLevel.toString();
    }

    if (this.temperature !== undefined) {
      hash.temperature = this.temperature.toString();
    }

    if (this.cpuUsage !== undefined) {
      hash.cpuUsage = this.cpuUsage.toString();
    }

    if (this.memoryUsage !== undefined) {
      hash.memoryUsage = this.memoryUsage.toString();
    }

    if (this.storageUsage !== undefined) {
      hash.storageUsage = this.storageUsage.toString();
    }

    if (Object.keys(this.metadata).length > 0) {
      hash.metadata = JSON.stringify(this.metadata);
    }

    return hash;
  }

  /**
   * Create from Redis hash
   */
  static fromRedisHash(hash: Record<string, string>): DeviceStateInfo {
    return new DeviceStateInfo({
      deviceId: hash.deviceId,
      serial: hash.serial,
      state: hash.state,
      batteryLevel: hash.batteryLevel ? parseFloat(hash.batteryLevel) : undefined,
      temperature: hash.temperature ? parseFloat(hash.temperature) : undefined,
      cpuUsage: hash.cpuUsage ? parseFloat(hash.cpuUsage) : undefined,
      memoryUsage: hash.memoryUsage ? parseFloat(hash.memoryUsage) : undefined,
      storageUsage: hash.storageUsage ? parseFloat(hash.storageUsage) : undefined,
      lastUpdated: new Date(hash.lastUpdated),
      metadata: hash.metadata ? JSON.parse(hash.metadata) : {}
    });
  }
}