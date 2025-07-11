import { injectable, inject } from 'tsyringe';
import { WebSocketConnection } from '../../domain/entities/WebSocketConnection.ts';
import { MessageDispatcher } from '../../application/services/MessageDispatcher.ts';
import { TOKENS } from '../../infrastructure/container/tokens.ts';
import { IDateProvider } from '../../domain/providers/IDateProvider.ts';
import { ILogger } from '../../domain/providers/ILogger.ts';
import { IResponseFactory } from '../../domain/factories/ResponseFactory.ts';
import { ApplicationError } from '../../domain/errors/ApplicationError.ts';
import type { IDeviceStateRepository } from '../../domain/repositories/IDeviceStateRepository.ts';
import type { IDeviceRepository } from '../../domain/repositories/IDeviceRepository.ts';
import type { IDeviceStateFactory } from '../../domain/factories/DeviceStateFactory.ts';

@injectable()
export class WebSocketController {
  private readonly logger: ILogger;

  constructor(
    @inject(TOKENS.MessageDispatcher)
    private readonly messageDispatcher: MessageDispatcher,
    @inject(TOKENS.DateProvider)
    private readonly dateProvider: IDateProvider,
    @inject(TOKENS.Logger)
    logger: ILogger,
    @inject(TOKENS.ResponseFactory)
    private readonly responseFactory: IResponseFactory,
    @inject(TOKENS.DeviceStateRepository)
    private readonly deviceStateRepository: IDeviceStateRepository,
    @inject(TOKENS.DeviceRepository)
    private readonly deviceRepository: IDeviceRepository,
    @inject(TOKENS.DeviceStateFactory)
    private readonly deviceStateFactory: IDeviceStateFactory
  ) {
    this.logger = logger.child({ component: 'WebSocketController' });
  }

  async handleConnection(connection: WebSocketConnection): Promise<void> {
    this.logger.info('New WebSocket connection established', {
      connectionId: connection.getId(),
      remoteAddress: connection.getRemoteAddress()
    });
    
    // Check if this connection has a device ID in metadata (reconnection)
    const metadata = connection.getMetadata();
    if (metadata.deviceId) {
      try {
        // Set device state to CONNECTING then ONLINE
        const device = await this.deviceRepository.findById(parseInt(metadata.deviceId));
        if (device) {
          const connectingState = this.deviceStateFactory.createInitialState(
            metadata.deviceId,
            device.getSerial()
          );
          await this.deviceStateRepository.updateState(metadata.deviceId, connectingState);
          
          // Set to online after a brief delay
          setTimeout(async () => {
            await this.deviceStateRepository.setOnline(metadata.deviceId, 300); // 5 min TTL
          }, 100);
        }
      } catch (error) {
        this.logger.error('Failed to update device state on connection', {
          deviceId: metadata.deviceId,
          error
        });
      }
    }
    
    await this.sendWelcomeMessage(connection);
  }

  async handleMessage(rawMessage: string, connection: WebSocketConnection): Promise<void> {
    const connectionLogger = this.logger.child({ connectionId: connection.getId() });
    
    try {
      connectionLogger.debug('Processing incoming message', {
        messageLength: rawMessage.length
      });
      
      await this.messageDispatcher.dispatch(rawMessage, connection);
      
      connectionLogger.debug('Message processed successfully');
    } catch (error) {
      connectionLogger.error('Error handling message', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      
      const errorResponse = this.responseFactory.createErrorResponse(
        error instanceof Error ? error : new Error(String(error)),
        connection.getId()
      );
      
      connection.send(errorResponse);
    }
  }

  async handleDisconnection(connection: WebSocketConnection): Promise<void> {
    const metadata = connection.getMetadata();
    
    this.logger.info('WebSocket connection disconnected', {
      connectionId: connection.getId(),
      username: metadata.username,
      room: metadata.room,
      connectionDuration: Date.now() - connection.getConnectedAt().getTime()
    });
    
    // Update device state to offline if device is associated
    if (metadata.deviceId) {
      try {
        await this.deviceStateRepository.setOffline(metadata.deviceId);
        this.logger.info('Device set to offline', {
          deviceId: metadata.deviceId,
          deviceSerial: metadata.deviceSerial
        });
      } catch (error) {
        this.logger.error('Failed to update device state on disconnection', {
          deviceId: metadata.deviceId,
          error
        });
      }
    }
  }

  async handleError(error: Error, connection?: WebSocketConnection): Promise<void> {
    this.logger.error('WebSocket error occurred', {
      error: error.message,
      stack: error.stack,
      connectionId: connection?.getId(),
      hasConnection: !!connection
    });
    
    if (connection) {
      const errorResponse = this.responseFactory.createErrorResponse(
        error,
        connection.getId()
      );
      
      try {
        connection.send(errorResponse);
      } catch (sendError) {
        this.logger.error('Failed to send error response to client', {
          connectionId: connection.getId(),
          sendError: sendError instanceof Error ? sendError.message : String(sendError)
        });
      }
    }
  }

  private async sendWelcomeMessage(connection: WebSocketConnection): Promise<void> {
    const welcomeMessage = this.responseFactory.createWelcomeResponse(connection.getId());
    connection.send(welcomeMessage);
  }
}