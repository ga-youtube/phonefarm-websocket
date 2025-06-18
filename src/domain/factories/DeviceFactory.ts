import { injectable, inject } from 'tsyringe';
import { Device, DeviceData } from '@/domain/entities/Device';
import { IDateProvider } from '@/domain/providers/IDateProvider';
import { TOKENS } from '@/infrastructure/container/tokens';

export interface IDeviceFactory {
  create(data: DeviceData): Device;
  fromJSON(data: DeviceData): Device;
}

@injectable()
export class DeviceFactory implements IDeviceFactory {
  constructor(
    @inject(TOKENS.DateProvider)
    private readonly dateProvider: IDateProvider
  ) {}
  create(data: DeviceData): Device {
    return new Device({
      ...data,
      lastSeenAt: data.lastSeenAt || this.dateProvider.now()
    });
  }

  fromJSON(data: DeviceData): Device {
    return new Device({
      ...data,
      createdAt: data.createdAt ? this.dateProvider.parse(data.createdAt.toString()) : undefined,
      updatedAt: data.updatedAt ? this.dateProvider.parse(data.updatedAt.toString()) : undefined,
      lastSeenAt: data.lastSeenAt ? this.dateProvider.parse(data.lastSeenAt.toString()) : undefined,
    });
  }
}