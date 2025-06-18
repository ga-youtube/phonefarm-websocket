import type { Device } from '@/domain/entities/Device';

export interface IDeviceRepository {
  /**
   * Create a new device or update existing one
   */
  upsert(device: Device): Promise<Device>;

  /**
   * Find device by unique identifier (serial number)
   */
  findBySerial(serial: string): Promise<Device | null>;

  /**
   * Find device by IMEI
   */
  findByImei(imei: string): Promise<Device | null>;

  /**
   * Find device by MAC address
   */
  findByMacAddress(macAddress: string): Promise<Device | null>;

  /**
   * Find device by connection ID
   */
  findByConnectionId(connectionId: string): Promise<Device | null>;

  /**
   * Find device by ID
   */
  findById(id: number): Promise<Device | null>;

  /**
   * Update device's last seen timestamp
   */
  updateLastSeen(serial: string): Promise<void>;

  /**
   * Get all devices
   */
  findAll(): Promise<Device[]>;

  /**
   * Get devices by brand
   */
  findByBrand(brand: string): Promise<Device[]>;

  /**
   * Delete device by serial
   */
  deleteBySerial(serial: string): Promise<void>;

  /**
   * Count total devices
   */
  count(): Promise<number>;
}