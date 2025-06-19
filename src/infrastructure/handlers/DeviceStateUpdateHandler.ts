import { injectable, inject } from 'tsyringe';
import { BaseMessageHandler } from './base/BaseMessageHandler.ts';
import { Message } from '../../domain/entities/Message.ts';
import { WebSocketConnection } from '../../domain/entities/WebSocketConnection.ts';
import { MessageType } from '../../domain/value-objects/MessageType.ts';
import { DeviceState } from '../../domain/value-objects/DeviceState.ts';
import type { IDeviceStateRepository } from '../../domain/repositories/IDeviceStateRepository.ts';
import type { IDeviceRepository } from '../../domain/repositories/IDeviceRepository.ts';
import type { IDeviceStateFactory } from '../../domain/factories/DeviceStateFactory.ts';
import type { IMessageFactory } from '../../domain/factories/MessageFactory.ts';
import type { ILogger } from '../../domain/providers/ILogger.ts';
import { TOKENS } from '../container/tokens.ts';
import { messageHandler } from '../decorators/messageHandler.ts';
import { ApplicationConstants } from '../../domain/constants/ApplicationConstants.ts';

@injectable()
@messageHandler(MessageType.DEVICE_STATE_UPDATE)
export class DeviceStateUpdateHandler extends BaseMessageHandler {
  constructor(
    @inject(TOKENS.DeviceStateRepository)
    private readonly deviceStateRepository: IDeviceStateRepository,
    @inject(TOKENS.DeviceRepository)
    private readonly deviceRepository: IDeviceRepository,
    @inject(TOKENS.DeviceStateFactory)
    private readonly deviceStateFactory: IDeviceStateFactory,
    @inject(TOKENS.MessageFactory)
    messageFactory: IMessageFactory,
    @inject(TOKENS.Logger)
    logger: ILogger
  ) {
    super(
      [MessageType.DEVICE_STATE_UPDATE],
      messageFactory,
      logger.child({ handler: 'DeviceStateUpdateHandler' })
    );
  }

  async handle(message: Message, connection: WebSocketConnection): Promise<void> {
    try {
      this.logger.info('Processing device state update', {
        connectionId: connection.getId(),
        messageId: message.getId()
      });

      const data = message.getData();
      
      // Validate device exists
      const device = await this.deviceRepository.findBySerial(data.serial);
      if (!device) {
        this.logger.warn('Device not found for state update', { serial: data.serial });
        await this.sendError(connection, 'Device not registered. Please send device info first.');
        return;
      }

      // Validate state transition if applicable
      const currentState = await this.deviceStateRepository.getState(device.getId()!.toString());
      if (currentState) {
        const newStateVO = new (await import('../../domain/value-objects/DeviceState.ts')).DeviceStateVO(data.state);
        if (!currentState.getState().canTransitionTo(newStateVO.getValue())) {
          this.logger.warn('Invalid state transition', {
            currentState: currentState.getStateValue(),
            newState: data.state
          });
          await this.sendError(
            connection,
            `Invalid state transition from ${currentState.getStateValue()} to ${data.state}`
          );
          return;
        }
      }

      // Create state info
      const stateInfo = this.deviceStateFactory.create({
        deviceId: device.getId()!.toString(),
        serial: data.serial,
        state: data.state,
        batteryLevel: data.batteryLevel,
        temperature: data.temperature,
        cpuUsage: data.cpuUsage,
        memoryUsage: data.memoryUsage,
        storageUsage: data.storageUsage,
        lastUpdated: new Date(),
        metadata: {
          ...data.metadata,
          connectionId: connection.getId(),
          updateSource: 'device'
        }
      });

      // Update state in Redis
      await this.deviceStateRepository.updateState(device.getId()!.toString(), stateInfo);

      // Update device last seen
      await this.deviceRepository.updateLastSeen(device.getSerial());

      // Update connection metadata
      connection.updateMetadata({
        ...connection.getMetadata(),
        deviceState: data.state,
        lastStateUpdate: new Date().toISOString()
      });

      this.logger.info('Device state updated successfully', {
        deviceId: device.getId(),
        serial: device.getSerial(),
        state: data.state,
        batteryLevel: data.batteryLevel
      });

      // Send success response
      await this.sendResponse(connection, MessageType.DEVICE_STATE_UPDATE, {
        deviceId: device.getId()!.toString(),
        status: 'updated',
        state: data.state,
        message: 'Device state updated successfully',
        timestamp: new Date().toISOString()
      });

      // Check if device needs attention
      if (stateInfo.needsAttention()) {
        this.logger.warn('Device needs attention', {
          deviceId: device.getId(),
          serial: device.getSerial(),
          healthScore: stateInfo.getHealthScore()
        });
        
        // Could trigger alerts or notifications here
      }

    } catch (error) {
      this.logger.error('Error processing device state update', {
        error: error instanceof Error ? error.message : 'Unknown error',
        connectionId: connection.getId(),
        messageId: message.getId()
      });

      await this.sendError(
        connection,
        ApplicationConstants.ERROR_MESSAGES.INTERNAL_SERVER_ERROR || 'Failed to update device state'
      );
    }
  }
}