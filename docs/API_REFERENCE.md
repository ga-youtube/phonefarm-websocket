# API Reference

## WebSocket Connection

### Connection URL
```
ws://localhost:3000
```

### Connection Headers (Optional)
```json
{
  "Authorization": "Bearer <token>"
}
```

## Message Format

Tất cả messages phải theo format JSON:

```typescript
interface Message {
  type: MessageType;
  data: any;
  timestamp?: number;
  id?: string;
}
```

## Message Types

### 1. Join Room

**Request:**
```json
{
  "type": "join_room",
  "data": {
    "roomId": "room-123",
    "username": "user123"
  }
}
```

**Response:**
```json
{
  "type": "join_room",
  "data": {
    "success": true,
    "roomId": "room-123",
    "members": ["user123", "user456"]
  }
}
```

**Errors:**
- `ROOM_NOT_FOUND`: Room không tồn tại
- `ALREADY_IN_ROOM`: User đã trong room khác

### 2. Leave Room

**Request:**
```json
{
  "type": "leave_room",
  "data": {
    "roomId": "room-123"
  }
}
```

**Response:**
```json
{
  "type": "leave_room",
  "data": {
    "success": true,
    "roomId": "room-123"
  }
}
```

### 3. Chat Message

**Request:**
```json
{
  "type": "chat",
  "data": {
    "message": "Hello everyone!",
    "roomId": "room-123"
  }
}
```

**Broadcast to Room:**
```json
{
  "type": "chat",
  "data": {
    "message": "Hello everyone!",
    "username": "user123",
    "roomId": "room-123",
    "timestamp": 1703123456789
  }
}
```

**Errors:**
- `NOT_IN_ROOM`: User không trong room
- `ROOM_NOT_FOUND`: Room không tồn tại

### 4. Broadcast (Server Only)

**Server Broadcast:**
```json
{
  "type": "broadcast",
  "data": {
    "message": "Server maintenance in 5 minutes",
    "level": "warning"
  }
}
```

### 5. Ping/Pong (Health Check)

**Request:**
```json
{
  "type": "ping",
  "data": {}
}
```

**Response:**
```json
{
  "type": "pong",
  "data": {
    "timestamp": 1703123456789
  }
}
```

### 6. Error Messages

**Format:**
```json
{
  "type": "error",
  "data": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": {} // Optional additional details
  }
}
```

## Error Codes

### Validation Errors (400-level)
- `INVALID_MESSAGE_FORMAT`: Message không đúng format JSON
- `MISSING_MESSAGE_TYPE`: Thiếu field type
- `INVALID_MESSAGE_TYPE`: Type không được hỗ trợ
- `VALIDATION_ERROR`: Data không pass validation schema

### Business Logic Errors (400-level)
- `NOT_IN_ROOM`: User chưa join room
- `ALREADY_IN_ROOM`: User đã trong room khác
- `ROOM_NOT_FOUND`: Room không tồn tại
- `ROOM_FULL`: Room đã đầy
- `UNAUTHORIZED`: Không có quyền thực hiện action

### System Errors (500-level)
- `INTERNAL_ERROR`: Lỗi server không xác định
- `SERVICE_UNAVAILABLE`: Service tạm thời không khả dụng
- `HANDLER_NOT_FOUND`: Không tìm thấy handler cho message type

## Validation Schemas

### Join Room Schema
```typescript
{
  roomId: string (required, min: 1),
  username: string (optional, min: 1, max: 50)
}
```

### Chat Message Schema
```typescript
{
  message: string (required, min: 1, max: 1000),
  roomId: string (optional - uses current room if not provided)
}
```

### Leave Room Schema
```typescript
{
  roomId: string (optional - leaves current room if not provided)
}
```

## Connection Lifecycle

### 1. Connection Established
```
Client → Connect → Server
Server → Connection ID assigned → Client
```

### 2. Authentication (Optional)
```
Client → Auth message → Server
Server → Auth response → Client
```

### 3. Room Operations
```
Client → Join room → Server
Server → Room state → Client
Server → Notify room members → Other clients
```

### 4. Disconnection
```
Client → Disconnect → Server
Server → Leave all rooms → Internal
Server → Notify affected rooms → Other clients
```

## Rate Limiting

### Default Limits
- **Messages per second**: 10 per connection
- **Connections per IP**: 5 concurrent
- **Message size**: 64KB max
- **Room joins per minute**: 5 per connection

### Rate Limit Response
```json
{
  "type": "error",
  "data": {
    "code": "RATE_LIMITED",
    "message": "Too many requests",
    "retryAfter": 60 // seconds
  }
}
```

## WebSocket Close Codes

- `1000`: Normal closure
- `1001`: Going away (server shutdown)
- `1003`: Unsupported data
- `1008`: Policy violation
- `1011`: Server error
- `4000`: Invalid authentication
- `4001`: Rate limited
- `4002`: Message too large

## Client Library Examples

### JavaScript/TypeScript
```typescript
const ws = new WebSocket('ws://localhost:3000');

ws.onopen = () => {
  // Join room
  ws.send(JSON.stringify({
    type: 'join_room',
    data: { roomId: 'lobby' }
  }));
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log('Received:', message);
};

// Send chat message
ws.send(JSON.stringify({
  type: 'chat',
  data: { message: 'Hello!' }
}));
```

### Python
```python
import websocket
import json

def on_message(ws, message):
    data = json.loads(message)
    print(f"Received: {data}")

def on_open(ws):
    # Join room
    ws.send(json.dumps({
        "type": "join_room",
        "data": {"roomId": "lobby"}
    }))

ws = websocket.WebSocketApp("ws://localhost:3000",
    on_open=on_open,
    on_message=on_message)

ws.run_forever()
```

## Testing Tools

### WebSocket Test Client
```bash
# Using wscat
wscat -c ws://localhost:3000

# Send message
> {"type":"join_room","data":{"roomId":"test"}}
```

### cURL
```bash
# Test connection
curl --include \
     --no-buffer \
     --header "Connection: Upgrade" \
     --header "Upgrade: websocket" \
     --header "Sec-WebSocket-Key: SGVsbG8sIHdvcmxkIQ==" \
     --header "Sec-WebSocket-Version: 13" \
     http://localhost:3000/
```