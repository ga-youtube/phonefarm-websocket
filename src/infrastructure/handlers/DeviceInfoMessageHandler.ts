import { BaseMessageHandler } from './base/BaseMessageHandler.ts';
import { Message } from '../../domain/entities/Message.ts';
import { WebSocketConnection } from '../../domain/entities/WebSocketConnection.ts';
import { MessageType } from '../../domain/value-objects/MessageType.ts';
import type { IDeviceRepository } from '../../domain/repositories/IDeviceRepository.ts';
import { Device } from '../../domain/entities/Device.ts';

export class DeviceInfoMessageHandler extends BaseMessageHandler {
  constructor(
    private readonly deviceRepository: IDeviceRepository
  ) {
    super([MessageType.DEVICE_INFO]);
  }

  async handle(message: Message, connection: WebSocketConnection): Promise<void> {
    try {
      console.log('Processing device info message', {
        connectionId: connection.getId(),
        messageId: message.getId()
      });

      const data = message.getData();
      
      // Validate required fields
      const requiredFields = ['serial', 'brand', 'model', 'release', 'sdkInt'];
      const validationErrors = this.validateRequiredFields(data, requiredFields);
      
      if (validationErrors.length > 0) {
        console.warn('Device info validation failed', { errors: validationErrors });
        await this.sendError(connection, validationErrors.join(', '));
        return;
      }

      // Additional validation for optional fields
      const additionalValidationErrors = this.validateOptionalFields(data);
      if (additionalValidationErrors.length > 0) {
        console.warn('Device info optional field validation failed', { errors: additionalValidationErrors });
        await this.sendError(connection, additionalValidationErrors.join(', '));
        return;
      }

      // Create device entity
      const device = new Device({
        connectionId: connection.getId(),
        serial: data.serial,
        imei: data.imei,
        macAddress: data.macAddress,
        wifiIpAddress: data.wifiIpAddress,
        brand: data.brand,
        model: data.model,
        androidRelease: data.release,
        androidSdkInt: Number(data.sdkInt),
      });

      // Upsert device to database
      const savedDevice = await this.deviceRepository.upsert(device);

      // Update connection metadata with device info
      connection.updateMetadata({
        ...connection.getMetadata(),
        deviceId: savedDevice.getId(),
        deviceSerial: savedDevice.getSerial(),
        deviceName: savedDevice.getDisplayName(),
        deviceBrand: savedDevice.getBrand(),
        deviceModel: savedDevice.getModel(),
      });

      console.log('Device info processed successfully', {
        deviceId: savedDevice.getId(),
        serial: savedDevice.getSerial(),
        displayName: savedDevice.getDisplayName()
      });

      // Send success response
      await this.sendResponse(connection, MessageType.DEVICE_INFO, {
        deviceId: savedDevice.getId(),
        status: 'registered',
        message: 'Device registered successfully',
        displayName: savedDevice.getDisplayName()
      });

    } catch (error) {
      console.error('Error processing device info message', {
        error: error instanceof Error ? error.message : 'Unknown error',
        connectionId: connection.getId(),
        messageId: message.getId()
      });

      await this.sendError(connection, 'Failed to process device information');
    }
  }

  private validateOptionalFields(data: any): string[] {
    const errors: string[] = [];

    // Validate MAC address format if provided
    if (data.macAddress && !/^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/.test(data.macAddress)) {
      errors.push('Invalid MAC address format. Expected format: AA:BB:CC:DD:EE:FF');
    }

    // Validate IP address format if provided
    if (data.wifiIpAddress && !/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(data.wifiIpAddress)) {
      errors.push('Invalid IP address format');
    }

    // Validate IMEI format if provided (15-16 digits)
    if (data.imei && !/^\d{15,16}$/.test(data.imei)) {
      errors.push('Invalid IMEI format. Expected 15-16 digits');
    }

    // Validate SDK int is a positive number
    if (data.sdkInt && (isNaN(Number(data.sdkInt)) || Number(data.sdkInt) < 1)) {
      errors.push('Android SDK int must be a positive number');
    }

    return errors;
  }
}