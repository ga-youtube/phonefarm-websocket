import { injectable } from 'tsyringe';
import { DeviceStateInfo, DeviceStateData } from '../entities/DeviceStateInfo.ts';
import { DeviceState } from '../value-objects/DeviceState.ts';

export interface IDeviceStateFactory {
  /**
   * Create a new DeviceStateInfo instance
   */
  create(data: DeviceStateData): DeviceStateInfo;

  /**
   * Create initial state for a new device
   */
  createInitialState(deviceId: string, serial: string): DeviceStateInfo;

  /**
   * Create online state
   */
  createOnlineState(deviceId: string, serial: string, metadata?: Record<string, any>): DeviceStateInfo;

  /**
   * Create offline state
   */
  createOfflineState(deviceId: string, serial: string): DeviceStateInfo;

  /**
   * Create error state
   */
  createErrorState(deviceId: string, serial: string, errorMessage: string): DeviceStateInfo;

  /**
   * Create state from partial data with defaults
   */
  createWithDefaults(partialData: Partial<DeviceStateData> & { deviceId: string; serial: string }): DeviceStateInfo;
}

@injectable()
export class DeviceStateFactory implements IDeviceStateFactory {
  create(data: DeviceStateData): DeviceStateInfo {
    return new DeviceStateInfo(data);
  }

  createInitialState(deviceId: string, serial: string): DeviceStateInfo {
    return new DeviceStateInfo({
      deviceId,
      serial,
      state: DeviceState.CONNECTING,
      lastUpdated: new Date(),
      metadata: {
        initialConnection: true,
        connectedAt: new Date().toISOString()
      }
    });
  }

  createOnlineState(deviceId: string, serial: string, metadata?: Record<string, any>): DeviceStateInfo {
    return new DeviceStateInfo({
      deviceId,
      serial,
      state: DeviceState.ONLINE,
      lastUpdated: new Date(),
      metadata: {
        ...metadata,
        onlineAt: new Date().toISOString()
      }
    });
  }

  createOfflineState(deviceId: string, serial: string): DeviceStateInfo {
    return new DeviceStateInfo({
      deviceId,
      serial,
      state: DeviceState.OFFLINE,
      lastUpdated: new Date(),
      metadata: {
        offlineAt: new Date().toISOString()
      }
    });
  }

  createErrorState(deviceId: string, serial: string, errorMessage: string): DeviceStateInfo {
    return new DeviceStateInfo({
      deviceId,
      serial,
      state: DeviceState.ERROR,
      lastUpdated: new Date(),
      metadata: {
        error: errorMessage,
        errorAt: new Date().toISOString()
      }
    });
  }

  createWithDefaults(partialData: Partial<DeviceStateData> & { deviceId: string; serial: string }): DeviceStateInfo {
    return new DeviceStateInfo({
      state: DeviceState.OFFLINE,
      lastUpdated: new Date(),
      metadata: {},
      ...partialData
    });
  }

  /**
   * Create state from device metrics
   */
  createFromMetrics(
    deviceId: string,
    serial: string,
    metrics: {
      batteryLevel?: number;
      temperature?: number;
      cpuUsage?: number;
      memoryUsage?: number;
      storageUsage?: number;
    }
  ): DeviceStateInfo {
    // Determine state based on metrics
    let state = DeviceState.ONLINE;
    const metadata: Record<string, any> = {};

    if (metrics.batteryLevel !== undefined) {
      if (metrics.batteryLevel < 5) {
        state = DeviceState.BATTERY_CRITICAL;
        metadata.batteryAlert = 'critical';
      } else if (metrics.batteryLevel < 20) {
        state = DeviceState.BATTERY_LOW;
        metadata.batteryAlert = 'low';
      }
    }

    if (metrics.temperature !== undefined && metrics.temperature > 70) {
      metadata.temperatureAlert = 'high';
    }

    if (metrics.cpuUsage !== undefined && metrics.cpuUsage > 80) {
      state = DeviceState.BUSY;
      metadata.cpuAlert = 'high';
    }

    return new DeviceStateInfo({
      deviceId,
      serial,
      state,
      batteryLevel: metrics.batteryLevel,
      temperature: metrics.temperature,
      cpuUsage: metrics.cpuUsage,
      memoryUsage: metrics.memoryUsage,
      storageUsage: metrics.storageUsage,
      lastUpdated: new Date(),
      metadata
    });
  }
}