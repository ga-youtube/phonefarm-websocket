import { injectable, inject } from 'tsyringe';
import { BaseMessageHandler } from './base/BaseMessageHandler.ts';
import { Message } from '../../domain/entities/Message.ts';
import { WebSocketConnection } from '../../domain/entities/WebSocketConnection.ts';
import { MessageType } from '../../domain/value-objects/MessageType.ts';
import type { IDeviceStateRepository } from '../../domain/repositories/IDeviceStateRepository.ts';
import type { IDeviceRepository } from '../../domain/repositories/IDeviceRepository.ts';
import type { IMessageFactory } from '../../domain/factories/MessageFactory.ts';
import type { ILogger } from '../../domain/providers/ILogger.ts';
import { TOKENS } from '../container/tokens.ts';
import { messageHandler } from '../decorators/messageHandler.ts';
import { ApplicationConstants } from '../../domain/constants/ApplicationConstants.ts';

@injectable()
@messageHandler(MessageType.GET_DEVICE_STATES)
export class GetDeviceStatesHandler extends BaseMessageHandler {
  constructor(
    @inject(TOKENS.DeviceStateRepository)
    private readonly deviceStateRepository: IDeviceStateRepository,
    @inject(TOKENS.DeviceRepository)
    private readonly deviceRepository: IDeviceRepository,
    @inject(TOKENS.MessageFactory)
    messageFactory: IMessageFactory,
    @inject(TOKENS.Logger)
    logger: ILogger
  ) {
    super(
      [MessageType.GET_DEVICE_STATES],
      messageFactory,
      logger.child({ handler: 'GetDeviceStatesHandler' })
    );
  }

  async handle(message: Message, connection: WebSocketConnection): Promise<void> {
    try {
      this.logger.info('Processing get device states request', {
        connectionId: connection.getId(),
        messageId: message.getId()
      });

      const data = message.getData() || {};
      const includeMetrics = data.includeMetrics !== false; // Default to true

      let states;

      if (data.deviceIds && Array.isArray(data.deviceIds) && data.deviceIds.length > 0) {
        // Get specific devices
        states = await this.deviceStateRepository.getStates(data.deviceIds);
      } else if (data.state) {
        // Get devices by state
        const deviceIds = await this.deviceStateRepository.getDevicesByState(data.state);
        states = await this.deviceStateRepository.getStates(deviceIds);
      } else {
        // Get all device states
        states = await this.deviceStateRepository.getAllStates();
      }

      // Format response
      const devicesData = await Promise.all(
        states.map(async (stateInfo) => {
          const device = await this.deviceRepository.findById(parseInt(stateInfo.getDeviceId()));
          
          const deviceData: any = {
            deviceId: stateInfo.getDeviceId(),
            serial: stateInfo.getSerial(),
            state: stateInfo.getStateValue(),
            lastUpdated: stateInfo.getLastUpdated().toISOString(),
            isStale: stateInfo.isStale(300), // 5 minutes
            needsAttention: stateInfo.needsAttention()
          };

          if (device) {
            deviceData.brand = device.getBrand();
            deviceData.model = device.getModel();
            deviceData.displayName = device.getDisplayName();
          }

          if (includeMetrics) {
            deviceData.metrics = {
              batteryLevel: stateInfo.getBatteryLevel(),
              temperature: stateInfo.getTemperature(),
              cpuUsage: stateInfo.getCpuUsage(),
              memoryUsage: stateInfo.getMemoryUsage(),
              storageUsage: stateInfo.getStorageUsage(),
              healthScore: stateInfo.getHealthScore()
            };
          }

          return deviceData;
        })
      );

      // Calculate summary statistics
      const summary = {
        totalDevices: devicesData.length,
        onlineCount: await this.deviceStateRepository.getOnlineCount(),
        stateBreakdown: this.calculateStateBreakdown(states),
        devicesNeedingAttention: devicesData.filter(d => d.needsAttention).length,
        averageHealthScore: this.calculateAverageHealthScore(states)
      };

      this.logger.info('Device states retrieved successfully', {
        totalDevices: devicesData.length,
        requestedDeviceIds: data.deviceIds,
        requestedState: data.state
      });

      // Send response
      await this.sendResponse(connection, MessageType.GET_DEVICE_STATES, {
        devices: devicesData,
        summary,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      this.logger.error('Error retrieving device states', {
        error: error instanceof Error ? error.message : 'Unknown error',
        connectionId: connection.getId(),
        messageId: message.getId()
      });

      await this.sendError(
        connection,
        ApplicationConstants.ERROR_MESSAGES.INTERNAL_SERVER_ERROR || 'Failed to retrieve device states'
      );
    }
  }

  private calculateStateBreakdown(states: any[]): Record<string, number> {
    const breakdown: Record<string, number> = {};
    
    for (const state of states) {
      const stateValue = state.getStateValue();
      breakdown[stateValue] = (breakdown[stateValue] || 0) + 1;
    }
    
    return breakdown;
  }

  private calculateAverageHealthScore(states: any[]): number {
    if (states.length === 0) return 0;
    
    const totalScore = states.reduce((sum, state) => sum + state.getHealthScore(), 0);
    return Math.round(totalScore / states.length);
  }
}