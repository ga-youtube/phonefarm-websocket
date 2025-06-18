import { Database } from '@/infrastructure/database/Database';
import type { Device as DeviceEntity } from '@/domain/entities/Device';
import { Device } from '@/domain/entities/Device';
import type { IDeviceRepository } from '@/domain/repositories/IDeviceRepository';
import type { Device as DeviceRow, NewDevice, DeviceUpdate } from '@/infrastructure/database/DatabaseSchema';

export class DeviceRepository implements IDeviceRepository {
  private readonly db = Database.getInstance();

  async upsert(device: DeviceEntity): Promise<DeviceEntity> {
    const existingDevice = await this.findBySerial(device.getSerial());
    
    if (existingDevice) {
      // Update existing device
      const updateData: DeviceUpdate = {
        connection_id: device.getConnectionId(),
        imei: device.getImei() || null,
        mac_address: device.getMacAddress() || null,
        wifi_ip_address: device.getWifiIpAddress() || null,
        brand: device.getBrand(),
        model: device.getModel(),
        android_release: device.getAndroidRelease(),
        android_sdk_int: device.getAndroidSdkInt(),
        updated_at: new Date(),
        last_seen_at: new Date(),
      };

      const updatedRow = await this.db
        .updateTable('devices')
        .set(updateData)
        .where('serial', '=', device.getSerial())
        .returningAll()
        .executeTakeFirstOrThrow();

      return this.rowToEntity(updatedRow);
    } else {
      // Insert new device
      const insertData: NewDevice = {
        connection_id: device.getConnectionId(),
        serial: device.getSerial(),
        imei: device.getImei() || null,
        mac_address: device.getMacAddress() || null,
        wifi_ip_address: device.getWifiIpAddress() || null,
        brand: device.getBrand(),
        model: device.getModel(),
        android_release: device.getAndroidRelease(),
        android_sdk_int: device.getAndroidSdkInt(),
        created_at: new Date(),
        updated_at: new Date(),
        last_seen_at: new Date(),
      };

      const insertedRow = await this.db
        .insertInto('devices')
        .values(insertData)
        .returningAll()
        .executeTakeFirstOrThrow();

      return this.rowToEntity(insertedRow);
    }
  }

  async findBySerial(serial: string): Promise<DeviceEntity | null> {
    const row = await this.db
      .selectFrom('devices')
      .selectAll()
      .where('serial', '=', serial)
      .executeTakeFirst();

    return row ? this.rowToEntity(row) : null;
  }

  async findByImei(imei: string): Promise<DeviceEntity | null> {
    const row = await this.db
      .selectFrom('devices')
      .selectAll()
      .where('imei', '=', imei)
      .executeTakeFirst();

    return row ? this.rowToEntity(row) : null;
  }

  async findByMacAddress(macAddress: string): Promise<DeviceEntity | null> {
    const row = await this.db
      .selectFrom('devices')
      .selectAll()
      .where('mac_address', '=', macAddress)
      .executeTakeFirst();

    return row ? this.rowToEntity(row) : null;
  }

  async findByConnectionId(connectionId: string): Promise<DeviceEntity | null> {
    const row = await this.db
      .selectFrom('devices')
      .selectAll()
      .where('connection_id', '=', connectionId)
      .executeTakeFirst();

    return row ? this.rowToEntity(row) : null;
  }

  async findById(id: number): Promise<DeviceEntity | null> {
    const row = await this.db
      .selectFrom('devices')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    return row ? this.rowToEntity(row) : null;
  }

  async updateLastSeen(serial: string): Promise<void> {
    await this.db
      .updateTable('devices')
      .set({
        last_seen_at: new Date(),
        updated_at: new Date(),
      })
      .where('serial', '=', serial)
      .execute();
  }

  async findAll(): Promise<DeviceEntity[]> {
    const rows = await this.db
      .selectFrom('devices')
      .selectAll()
      .orderBy('last_seen_at', 'desc')
      .execute();

    return rows.map(row => this.rowToEntity(row));
  }

  async findByBrand(brand: string): Promise<DeviceEntity[]> {
    const rows = await this.db
      .selectFrom('devices')
      .selectAll()
      .where('brand', '=', brand)
      .orderBy('last_seen_at', 'desc')
      .execute();

    return rows.map(row => this.rowToEntity(row));
  }

  async deleteBySerial(serial: string): Promise<void> {
    await this.db
      .deleteFrom('devices')
      .where('serial', '=', serial)
      .execute();
  }

  async count(): Promise<number> {
    const result = await this.db
      .selectFrom('devices')
      .select(eb => eb.fn.count('id').as('count'))
      .executeTakeFirstOrThrow();

    return Number(result.count);
  }

  private rowToEntity(row: DeviceRow): DeviceEntity {
    return new Device({
      id: row.id,
      connectionId: row.connection_id,
      serial: row.serial,
      imei: row.imei || undefined,
      macAddress: row.mac_address || undefined,
      wifiIpAddress: row.wifi_ip_address || undefined,
      brand: row.brand,
      model: row.model,
      androidRelease: row.android_release,
      androidSdkInt: row.android_sdk_int,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      lastSeenAt: row.last_seen_at,
    });
  }

  private entityToRow(entity: DeviceEntity): Partial<DeviceRow> {
    return {
      id: entity.getId(),
      connection_id: entity.getConnectionId(),
      serial: entity.getSerial(),
      imei: entity.getImei() || null,
      mac_address: entity.getMacAddress() || null,
      wifi_ip_address: entity.getWifiIpAddress() || null,
      brand: entity.getBrand(),
      model: entity.getModel(),
      android_release: entity.getAndroidRelease(),
      android_sdk_int: entity.getAndroidSdkInt(),
      created_at: entity.getCreatedAt(),
      updated_at: entity.getUpdatedAt(),
      last_seen_at: entity.getLastSeenAt(),
    };
  }
}