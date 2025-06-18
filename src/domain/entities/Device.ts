export interface DeviceData {
  id?: number;
  connectionId: string;
  serial: string;
  imei?: string;
  macAddress?: string;
  wifiIpAddress?: string;
  brand: string;
  model: string;
  androidRelease: string;
  androidSdkInt: number;
  createdAt?: Date;
  updatedAt?: Date;
  lastSeenAt?: Date;
}

export class Device {
  private readonly id?: number;
  private readonly connectionId: string;
  private readonly serial: string;
  private readonly imei?: string;
  private readonly macAddress?: string;
  private readonly wifiIpAddress?: string;
  private readonly brand: string;
  private readonly model: string;
  private readonly androidRelease: string;
  private readonly androidSdkInt: number;
  private readonly createdAt?: Date;
  private readonly updatedAt?: Date;
  private readonly lastSeenAt?: Date;

  constructor(data: DeviceData) {
    this.validateData(data);
    
    this.id = data.id;
    this.connectionId = data.connectionId;
    this.serial = data.serial;
    this.imei = data.imei;
    this.macAddress = data.macAddress;
    this.wifiIpAddress = data.wifiIpAddress;
    this.brand = data.brand;
    this.model = data.model;
    this.androidRelease = data.androidRelease;
    this.androidSdkInt = data.androidSdkInt;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
    this.lastSeenAt = data.lastSeenAt || new Date();
  }

  private validateData(data: DeviceData): void {
    if (!data.connectionId?.trim()) {
      throw new Error('Connection ID is required');
    }
    if (!data.serial?.trim()) {
      throw new Error('Serial number is required');
    }
    if (!data.brand?.trim()) {
      throw new Error('Brand is required');
    }
    if (!data.model?.trim()) {
      throw new Error('Model is required');
    }
    if (!data.androidRelease?.trim()) {
      throw new Error('Android release is required');
    }
    if (typeof data.androidSdkInt !== 'number' || data.androidSdkInt < 1) {
      throw new Error('Android SDK int must be a positive number');
    }

    // Validate MAC address format if provided
    if (data.macAddress && !/^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/.test(data.macAddress)) {
      throw new Error('Invalid MAC address format');
    }

    // Validate IP address format if provided
    if (data.wifiIpAddress && !/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(data.wifiIpAddress)) {
      throw new Error('Invalid IP address format');
    }

    // Validate IMEI format if provided (15-16 digits)
    if (data.imei && !/^\d{15,16}$/.test(data.imei)) {
      throw new Error('Invalid IMEI format');
    }
  }

  getId(): number | undefined {
    return this.id;
  }

  getConnectionId(): string {
    return this.connectionId;
  }

  getSerial(): string {
    return this.serial;
  }

  getImei(): string | undefined {
    return this.imei;
  }

  getMacAddress(): string | undefined {
    return this.macAddress;
  }

  getWifiIpAddress(): string | undefined {
    return this.wifiIpAddress;
  }

  getBrand(): string {
    return this.brand;
  }

  getModel(): string {
    return this.model;
  }

  getAndroidRelease(): string {
    return this.androidRelease;
  }

  getAndroidSdkInt(): number {
    return this.androidSdkInt;
  }

  getCreatedAt(): Date | undefined {
    return this.createdAt;
  }

  getUpdatedAt(): Date | undefined {
    return this.updatedAt;
  }

  getLastSeenAt(): Date | undefined {
    return this.lastSeenAt;
  }

  getDisplayName(): string {
    const ipInfo = this.wifiIpAddress ? ` - ${this.wifiIpAddress}` : '';
    return `${this.brand} ${this.model} (Android ${this.androidRelease})${ipInfo}`;
  }

  getUniqueIdentifier(): string {
    return this.serial;
  }

  getBackupIdentifier(): string | undefined {
    return this.imei || this.macAddress;
  }

  toJSON(): DeviceData {
    return {
      id: this.id,
      connectionId: this.connectionId,
      serial: this.serial,
      imei: this.imei,
      macAddress: this.macAddress,
      wifiIpAddress: this.wifiIpAddress,
      brand: this.brand,
      model: this.model,
      androidRelease: this.androidRelease,
      androidSdkInt: this.androidSdkInt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      lastSeenAt: this.lastSeenAt,
    };
  }

  static fromJSON(data: DeviceData): Device {
    return new Device({
      ...data,
      createdAt: data.createdAt ? new Date(data.createdAt) : undefined,
      updatedAt: data.updatedAt ? new Date(data.updatedAt) : undefined,
      lastSeenAt: data.lastSeenAt ? new Date(data.lastSeenAt) : undefined,
    });
  }
}