import { injectable } from 'tsyringe';
import { Device, DeviceData } from '@/domain/entities/Device';

export interface IDeviceFactory {
  create(data: DeviceData): Device;
  fromJSON(data: DeviceData): Device;
}

@injectable()
export class DeviceFactory implements IDeviceFactory {
  create(data: DeviceData): Device {
    return new Device(data);
  }

  fromJSON(data: DeviceData): Device {
    return new Device({
      ...data,
      createdAt: data.createdAt ? new Date(data.createdAt) : undefined,
      updatedAt: data.updatedAt ? new Date(data.updatedAt) : undefined,
      lastSeenAt: data.lastSeenAt ? new Date(data.lastSeenAt) : undefined,
    });
  }
}