import type { Generated, Insertable, Selectable, Updateable } from 'kysely';

export interface DeviceTable {
  id: Generated<number>;
  connection_id: string;
  serial: string;
  imei: string | null;
  mac_address: string | null;
  wifi_ip_address: string | null;
  brand: string;
  model: string;
  android_release: string;
  android_sdk_int: number;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
  last_seen_at: Generated<Date>;
}

export interface Database {
  devices: DeviceTable;
}

// Type helpers for Device operations
export type Device = Selectable<DeviceTable>;
export type NewDevice = Insertable<DeviceTable>;
export type DeviceUpdate = Updateable<DeviceTable>;