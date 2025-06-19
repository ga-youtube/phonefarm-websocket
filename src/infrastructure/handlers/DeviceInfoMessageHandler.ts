import { injectable, inject } from 'tsyringe';
import { BaseMessageHandler } from './base/BaseMessageHandler.ts';
import { Message } from '../../domain/entities/Message.ts';
import { WebSocketConnection } from '../../domain/entities/WebSocketConnection.ts';
import { MessageType } from '../../domain/value-objects/MessageType.ts';
import type { IDeviceRepository } from '../../domain/repositories/IDeviceRepository.ts';
import type { IDeviceFactory } from '../../domain/factories/DeviceFactory.ts';
import type { IMessageFactory } from '../../domain/factories/MessageFactory.ts';
import type { IDeviceStateRepository } from '../../domain/repositories/IDeviceStateRepository.ts';
import type { IDeviceStateFactory } from '../../domain/factories/DeviceStateFactory.ts';
import { TOKENS } from '../container/tokens.ts';
import { messageHandler } from '../decorators/messageHandler.ts';
import { ILogger } from '../../domain/providers/ILogger.ts';
import { ApplicationConstants } from '../../domain/constants/ApplicationConstants.ts';

@injectable()
@messageHandler(MessageType.DEVICE_INFO)
export class DeviceInfoMessageHandler extends BaseMessageHandler {
  constructor(
    @inject(TOKENS.DeviceRepository)
    private readonly deviceRepository: IDeviceRepository,
    @inject(TOKENS.DeviceFactory)
    private readonly deviceFactory: IDeviceFactory,
    @inject(TOKENS.MessageFactory)
    messageFactory: IMessageFactory,
    @inject(TOKENS.Logger)
    logger: ILogger,
    @inject(TOKENS.DeviceStateRepository)
    private readonly deviceStateRepository: IDeviceStateRepository,
    @inject(TOKENS.DeviceStateFactory)
    private readonly deviceStateFactory: IDeviceStateFactory
  ) {
    super(
      [MessageType.DEVICE_INFO], 
      messageFactory,
      logger.child({ handler: 'DeviceInfoMessageHandler' })
    );
  }

  async handle(message: Message, connection: WebSocketConnection): Promise<void> {
    try {
      this.logger.info('Processing device info message', {
        connectionId: connection.getId(),
        messageId: message.getId()
      });

      const data = message.getData();
      
      // Validate required fields
      const requiredFields = ['serial', 'brand', 'model', 'release', 'sdkInt'];
      const validationErrors = this.validateRequiredFields(data, requiredFields);
      
      if (validationErrors.length > 0) {
        this.logger.warn('Device info validation failed', { errors: validationErrors });
        await this.sendError(connection, validationErrors.join(', '));
        return;
      }

      // Additional validation for optional fields
      const additionalValidationErrors = this.validateOptionalFields(data);
      if (additionalValidationErrors.length > 0) {
        this.logger.warn('Device info optional field validation failed', { errors: additionalValidationErrors });
        await this.sendError(connection, additionalValidationErrors.join(', '));
        return;
      }

      // Create device entity
      const device = this.deviceFactory.create({
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
        deviceId: savedDevice.getId()!.toString(),
        deviceSerial: savedDevice.getSerial(),
        deviceName: savedDevice.getDisplayName(),
        deviceBrand: savedDevice.getBrand(),
        deviceModel: savedDevice.getModel(),
      });

      // Set device state to ONLINE
      const onlineState = this.deviceStateFactory.createOnlineState(
        savedDevice.getId()!.toString(),
        savedDevice.getSerial(),
        {
          connectionId: connection.getId(),
          ipAddress: savedDevice.getWifiIpAddress(),
          brand: savedDevice.getBrand(),
          model: savedDevice.getModel()
        }
      );
      await this.deviceStateRepository.updateState(savedDevice.getId()!.toString(), onlineState);

      this.logger.info('Device info processed successfully', {
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
      this.logger.error('Error processing device info message', {
        error: error instanceof Error ? error.message : 'Unknown error',
        connectionId: connection.getId(),
        messageId: message.getId()
      });

      await this.sendError(connection, ApplicationConstants.ERROR_MESSAGES.DEVICE_REGISTRATION_FAILED);
    }
  }

  private validateOptionalFields(data: any): string[] {
    const errors: string[] = [];

    // Validate MAC address format if provided
    if (data.macAddress && !ApplicationConstants.MAC_ADDRESS_REGEX.test(data.macAddress)) {
      errors.push('Invalid MAC address format. Expected format: AA:BB:CC:DD:EE:FF');
    }

    // Validate IP address format if provided
    if (data.wifiIpAddress && !ApplicationConstants.IP_ADDRESS_REGEX.test(data.wifiIpAddress)) {
      errors.push('Invalid IP address format');
    }

    // Validate IMEI format if provided (15-16 digits)
    if (data.imei && !ApplicationConstants.IMEI_REGEX.test(data.imei)) {
      errors.push('Invalid IMEI format. Expected 15-16 digits');
    }

    // Validate SDK int is a positive number
    if (data.sdkInt && (isNaN(Number(data.sdkInt)) || Number(data.sdkInt) < 1)) {
      errors.push('Android SDK int must be a positive number');
    }

    return errors;
  }
}