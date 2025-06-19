export const TOKENS = {
  // Database
  Database: Symbol.for("Database"),

  // Repositories
  ConnectionRepository: Symbol.for("ConnectionRepository"),
  DeviceRepository: Symbol.for("DeviceRepository"),

  // Services
  BunWebSocketServer: Symbol.for("BunWebSocketServer"),
  MessageHandlerRegistry: Symbol.for("MessageHandlerRegistry"),
  MessageValidator: Symbol.for("MessageValidator"),
  MessageDispatcher: Symbol.for("MessageDispatcher"),

  // Use Cases
  BroadcastMessageUseCase: Symbol.for("BroadcastMessageUseCase"),
  HandleMessageUseCase: Symbol.for("HandleMessageUseCase"),

  // Controllers
  WebSocketController: Symbol.for("WebSocketController"),

  // Handlers
  ChatMessageHandler: Symbol.for("ChatMessageHandler"),
  JoinRoomHandler: Symbol.for("JoinRoomHandler"),
  LeaveRoomHandler: Symbol.for("LeaveRoomHandler"),
  DeviceInfoMessageHandler: Symbol.for("DeviceInfoMessageHandler"),

  // Factories
  MessageFactory: Symbol.for("MessageFactory"),
  DeviceFactory: Symbol.for("DeviceFactory"),
  WebSocketConnectionFactory: Symbol.for("WebSocketConnectionFactory"),
  ResponseFactory: Symbol.for("ResponseFactory"),

  // Providers
  DateProvider: Symbol.for("DateProvider"),
  Logger: Symbol.for("Logger"),
  ConfigurationProvider: Symbol.for("ConfigurationProvider"),

  // Utilities
  HandlerDiscovery: Symbol.for("HandlerDiscovery"),
  WebSocketAdapter: Symbol.for("WebSocketAdapter"),
  
  // Middleware
  ValidationMiddleware: Symbol.for("ValidationMiddleware"),
  RateLimitMiddleware: Symbol.for("RateLimitMiddleware"),
  MiddlewarePipeline: Symbol.for("MiddlewarePipeline"),
} as const;

