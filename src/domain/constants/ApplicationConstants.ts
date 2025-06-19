export const ApplicationConstants = {
  // Server defaults
  DEFAULT_PORT: 3000,
  DEFAULT_HOST: 'localhost',
  DEFAULT_WS_ENDPOINT: '/ws',
  
  // Database defaults
  DEFAULT_DB_MAX_CONNECTIONS: 20,
  DEFAULT_DB_IDLE_TIMEOUT_MS: 30000,
  DEFAULT_DB_CONNECTION_TIMEOUT_MS: 2000,
  
  // Logging defaults
  DEFAULT_LOG_LEVEL: 'info',
  DEFAULT_LOG_ERROR_PATH: 'logs/error.log',
  DEFAULT_LOG_COMBINED_PATH: 'logs/combined.log',
  DEFAULT_SERVICE_NAME: 'phonefarm-websocket',
  
  // WebSocket states
  WS_READY_STATE: {
    CONNECTING: 0,
    OPEN: 1,
    CLOSING: 2,
    CLOSED: 3
  },
  
  // Message types
  SYSTEM_MESSAGE_TYPES: {
    WELCOME: 'welcome',
    ERROR: 'error',
    PING: 'ping',
    PONG: 'pong'
  },
  
  // Room defaults
  DEFAULT_ROOM: 'general',
  DEFAULT_USERNAME: 'Anonymous',
  
  // Validation
  IMEI_REGEX: /^\d{15,16}$/,
  MAC_ADDRESS_REGEX: /^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/,
  IP_ADDRESS_REGEX: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
  
  // Error messages
  ERROR_MESSAGES: {
    INTERNAL_SERVER_ERROR: 'Internal server error',
    CONNECTION_ERROR: 'Connection error occurred',
    VALIDATION_ERROR: 'Validation error',
    NOT_IN_ROOM: 'Not currently in any room',
    DEVICE_REGISTRATION_FAILED: 'Failed to process device information'
  }
} as const;