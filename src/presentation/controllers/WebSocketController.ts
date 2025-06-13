import { WebSocketConnection } from '../../domain/entities/WebSocketConnection.ts';
import { MessageDispatcher } from '../../application/services/MessageDispatcher.ts';

export class WebSocketController {
  constructor(
    private readonly messageDispatcher: MessageDispatcher
  ) {}

  async handleConnection(connection: WebSocketConnection): Promise<void> {
    console.log(`New connection established: ${connection.getId()}`);
    
    await this.sendWelcomeMessage(connection);
  }

  async handleMessage(rawMessage: string, connection: WebSocketConnection): Promise<void> {
    try {
      await this.messageDispatcher.dispatch(rawMessage, connection);
    } catch (error) {
      console.error('Error handling message:', error);
      
      const errorResponse = JSON.stringify({
        type: 'error',
        data: { 
          message: 'Internal server error' 
        },
        timestamp: new Date()
      });
      
      connection.send(errorResponse);
    }
  }

  async handleDisconnection(connection: WebSocketConnection): Promise<void> {
    console.log(`Connection disconnected: ${connection.getId()}`);
    
    const metadata = connection.getMetadata();
    if (metadata.room && metadata.username) {
      console.log(`User ${metadata.username} left room ${metadata.room}`);
    }
  }

  async handleError(error: Error, connection?: WebSocketConnection): Promise<void> {
    console.error('WebSocket error:', error);
    
    if (connection) {
      const errorResponse = JSON.stringify({
        type: 'error',
        data: { 
          message: 'Connection error occurred' 
        },
        timestamp: new Date()
      });
      
      try {
        connection.send(errorResponse);
      } catch (sendError) {
        console.error('Failed to send error response:', sendError);
      }
    }
  }

  private async sendWelcomeMessage(connection: WebSocketConnection): Promise<void> {
    const welcomeMessage = JSON.stringify({
      type: 'welcome',
      data: {
        connectionId: connection.getId(),
        message: 'Connected to WebSocket server',
        timestamp: new Date()
      }
    });
    
    connection.send(welcomeMessage);
  }
}