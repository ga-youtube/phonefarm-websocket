/**
 * Device state enumeration
 */
export enum DeviceState {
  // Connection states
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE',
  CONNECTING = 'CONNECTING',
  DISCONNECTED = 'DISCONNECTED',
  
  // Activity states
  IDLE = 'IDLE',
  BUSY = 'BUSY',
  WORKING = 'WORKING',
  
  // Power states
  CHARGING = 'CHARGING',
  BATTERY_LOW = 'BATTERY_LOW',
  BATTERY_CRITICAL = 'BATTERY_CRITICAL',
  
  // Error states
  ERROR = 'ERROR',
  UNREACHABLE = 'UNREACHABLE',
  MAINTENANCE = 'MAINTENANCE'
}

/**
 * Device state value object
 */
export class DeviceStateVO {
  private readonly value: DeviceState;

  constructor(value: DeviceState | string) {
    this.value = this.validate(value);
  }

  private validate(value: DeviceState | string): DeviceState {
    if (!Object.values(DeviceState).includes(value as DeviceState)) {
      throw new Error(`Invalid device state: ${value}`);
    }
    return value as DeviceState;
  }

  getValue(): DeviceState {
    return this.value;
  }

  toString(): string {
    return this.value;
  }

  equals(other: DeviceStateVO): boolean {
    return this.value === other.value;
  }

  isOnline(): boolean {
    return this.value === DeviceState.ONLINE;
  }

  isOffline(): boolean {
    return this.value === DeviceState.OFFLINE || 
           this.value === DeviceState.DISCONNECTED;
  }

  isBusy(): boolean {
    return this.value === DeviceState.BUSY || 
           this.value === DeviceState.WORKING;
  }

  isAvailable(): boolean {
    return this.value === DeviceState.ONLINE || 
           this.value === DeviceState.IDLE;
  }

  isError(): boolean {
    return this.value === DeviceState.ERROR || 
           this.value === DeviceState.UNREACHABLE;
  }

  isPowerRelated(): boolean {
    return this.value === DeviceState.CHARGING || 
           this.value === DeviceState.BATTERY_LOW || 
           this.value === DeviceState.BATTERY_CRITICAL;
  }

  /**
   * Check if transition from current state to target state is valid
   */
  canTransitionTo(targetState: DeviceState): boolean {
    // Define valid state transitions
    const validTransitions: Record<DeviceState, DeviceState[]> = {
      [DeviceState.OFFLINE]: [DeviceState.CONNECTING, DeviceState.ONLINE, DeviceState.ERROR],
      [DeviceState.CONNECTING]: [DeviceState.ONLINE, DeviceState.OFFLINE, DeviceState.ERROR],
      [DeviceState.ONLINE]: [DeviceState.IDLE, DeviceState.BUSY, DeviceState.OFFLINE, DeviceState.DISCONNECTED, DeviceState.ERROR],
      [DeviceState.IDLE]: [DeviceState.BUSY, DeviceState.WORKING, DeviceState.OFFLINE, DeviceState.ERROR],
      [DeviceState.BUSY]: [DeviceState.IDLE, DeviceState.WORKING, DeviceState.OFFLINE, DeviceState.ERROR],
      [DeviceState.WORKING]: [DeviceState.IDLE, DeviceState.BUSY, DeviceState.OFFLINE, DeviceState.ERROR],
      [DeviceState.DISCONNECTED]: [DeviceState.CONNECTING, DeviceState.OFFLINE],
      [DeviceState.CHARGING]: [DeviceState.ONLINE, DeviceState.IDLE, DeviceState.BUSY],
      [DeviceState.BATTERY_LOW]: [DeviceState.CHARGING, DeviceState.BATTERY_CRITICAL, DeviceState.OFFLINE],
      [DeviceState.BATTERY_CRITICAL]: [DeviceState.CHARGING, DeviceState.OFFLINE],
      [DeviceState.ERROR]: [DeviceState.OFFLINE, DeviceState.MAINTENANCE],
      [DeviceState.UNREACHABLE]: [DeviceState.OFFLINE, DeviceState.CONNECTING],
      [DeviceState.MAINTENANCE]: [DeviceState.OFFLINE]
    };

    const allowedTransitions = validTransitions[this.value] || [];
    return allowedTransitions.includes(targetState);
  }

  /**
   * Get state priority for sorting (higher number = higher priority)
   */
  getPriority(): number {
    const priorities: Record<DeviceState, number> = {
      [DeviceState.ERROR]: 100,
      [DeviceState.UNREACHABLE]: 90,
      [DeviceState.BATTERY_CRITICAL]: 80,
      [DeviceState.BATTERY_LOW]: 70,
      [DeviceState.MAINTENANCE]: 60,
      [DeviceState.OFFLINE]: 50,
      [DeviceState.DISCONNECTED]: 40,
      [DeviceState.CONNECTING]: 30,
      [DeviceState.WORKING]: 20,
      [DeviceState.BUSY]: 15,
      [DeviceState.CHARGING]: 10,
      [DeviceState.IDLE]: 5,
      [DeviceState.ONLINE]: 0
    };

    return priorities[this.value] || 0;
  }

  static fromString(value: string): DeviceStateVO {
    return new DeviceStateVO(value);
  }
}