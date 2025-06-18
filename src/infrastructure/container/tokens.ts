export const TOKENS = {
  // Repositories
  ConnectionRepository: Symbol.for('ConnectionRepository'),
  DeviceRepository: Symbol.for('DeviceRepository'),
  
  // Services
  BunWebSocketServer: Symbol.for('BunWebSocketServer'),
  MessageHandlerRegistry: Symbol.for('MessageHandlerRegistry'),
  MessageValidator: Symbol.for('MessageValidator'),
  MessageDispatcher: Symbol.for('MessageDispatcher'),
  
  // Use Cases
  BroadcastMessageUseCase: Symbol.for('BroadcastMessageUseCase'),
  HandleMessageUseCase: Symbol.for('HandleMessageUseCase'),
  
  // Controllers
  WebSocketController: Symbol.for('WebSocketController'),
  
  // Handlers
  ChatMessageHandler: Symbol.for('ChatMessageHandler'),
  JoinRoomHandler: Symbol.for('JoinRoomHandler'),
  LeaveRoomHandler: Symbol.for('LeaveRoomHandler'),
  DeviceInfoMessageHandler: Symbol.for('DeviceInfoMessageHandler'),
} as const;