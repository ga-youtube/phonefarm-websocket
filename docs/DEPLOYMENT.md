# Hướng Dẫn Triển Khai

## Môi Trường Development

### Yêu Cầu
- Bun.js >= 1.0.0
- Node.js >= 18 (optional, cho compatibility)
- TypeScript >= 5.0

### Setup
```bash
# Clone repository
git clone <repository-url>
cd phonefarm-websocket

# Install dependencies
bun install

# Run development server
bun run dev
```

### Environment Variables
```env
# .env.development
NODE_ENV=development
PORT=3000
LOG_LEVEL=debug
MAX_CONNECTIONS=100
MAX_ROOMS=50
```

## Build Production

### Build Command
```bash
# Type checking
bun run typecheck

# Build for production
bun run build

# Output: dist/server.js
```

### Production Environment Variables
```env
# .env.production
NODE_ENV=production
PORT=3000
LOG_LEVEL=info
MAX_CONNECTIONS=1000
MAX_ROOMS=500
REDIS_URL=redis://localhost:6379
```

## Deployment Options

### 1. Docker Deployment

**Dockerfile:**
```dockerfile
FROM oven/bun:1-alpine

WORKDIR /app

# Copy package files
COPY package.json bun.lockb ./
RUN bun install --production

# Copy source code
COPY . .

# Build application
RUN bun run build

# Expose port
EXPOSE 3000

# Start server
CMD ["bun", "run", "start"]
```

**docker-compose.yml:**
```yaml
version: '3.8'

services:
  websocket-server:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
    restart: unless-stopped
    networks:
      - app-network

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    networks:
      - app-network

networks:
  app-network:
    driver: bridge
```

**Deploy với Docker:**
```bash
# Build image
docker build -t websocket-server .

# Run container
docker run -d -p 3000:3000 --name ws-server websocket-server

# Using docker-compose
docker-compose up -d
```

### 2. PM2 Deployment

**ecosystem.config.js:**
```javascript
module.exports = {
  apps: [{
    name: 'websocket-server',
    script: './dist/server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_file: './logs/pm2-combined.log',
    time: true
  }]
};
```

**Deploy với PM2:**
```bash
# Install PM2
npm install -g pm2

# Build application
bun run build

# Start with PM2
pm2 start ecosystem.config.js

# Save PM2 config
pm2 save
pm2 startup
```

### 3. Systemd Service

**websocket-server.service:**
```ini
[Unit]
Description=WebSocket Server
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/websocket-server
ExecStart=/usr/local/bin/bun run start
Restart=on-failure
RestartSec=10

Environment=NODE_ENV=production
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
```

**Setup:**
```bash
# Copy service file
sudo cp websocket-server.service /etc/systemd/system/

# Reload systemd
sudo systemctl daemon-reload

# Enable and start service
sudo systemctl enable websocket-server
sudo systemctl start websocket-server
```

## Nginx Configuration

### WebSocket Proxy
```nginx
upstream websocket {
    server localhost:3000;
}

server {
    listen 80;
    server_name ws.example.com;

    location / {
        proxy_pass http://websocket;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket specific
        proxy_read_timeout 86400;
        proxy_send_timeout 86400;
    }
}
```

### SSL Configuration
```nginx
server {
    listen 443 ssl http2;
    server_name ws.example.com;

    ssl_certificate /etc/ssl/certs/example.com.crt;
    ssl_certificate_key /etc/ssl/private/example.com.key;
    
    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers off;

    location / {
        proxy_pass http://websocket;
        # ... (same as above)
    }
}
```

## Scaling Strategies

### 1. Horizontal Scaling với Redis

**Setup Redis Adapter:**
```typescript
// src/infrastructure/adapters/RedisAdapter.ts
import { createClient } from 'redis';

export class RedisAdapter {
  private publisher;
  private subscriber;

  constructor(url: string) {
    this.publisher = createClient({ url });
    this.subscriber = this.publisher.duplicate();
  }

  async publishToRoom(roomId: string, message: any) {
    await this.publisher.publish(`room:${roomId}`, JSON.stringify(message));
  }

  async subscribeToRoom(roomId: string, callback: (message: any) => void) {
    await this.subscriber.subscribe(`room:${roomId}`, (message) => {
      callback(JSON.parse(message));
    });
  }
}
```

### 2. Load Balancing

**HAProxy Configuration:**
```
global
    maxconn 4096

defaults
    mode http
    timeout connect 5000ms
    timeout client 50000ms
    timeout server 50000ms

frontend websocket_frontend
    bind *:80
    default_backend websocket_backend

backend websocket_backend
    balance roundrobin
    option httpchk GET /health
    server ws1 localhost:3001 check
    server ws2 localhost:3002 check
    server ws3 localhost:3003 check
```

## Monitoring

### 1. Health Check Endpoint

```typescript
// src/infrastructure/health/HealthCheck.ts
export class HealthCheck {
  static async check(): Promise<HealthStatus> {
    return {
      status: 'healthy',
      uptime: process.uptime(),
      connections: connectionCount,
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString()
    };
  }
}
```

### 2. Prometheus Metrics

```typescript
// src/infrastructure/metrics/PrometheusMetrics.ts
import { register, Counter, Gauge } from 'prom-client';

export const websocketConnections = new Gauge({
  name: 'websocket_connections_total',
  help: 'Total number of WebSocket connections'
});

export const messageCounter = new Counter({
  name: 'websocket_messages_total',
  help: 'Total messages processed',
  labelNames: ['type']
});
```

### 3. Logging với ELK Stack

**Filebeat Configuration:**
```yaml
filebeat.inputs:
- type: log
  enabled: true
  paths:
    - /var/log/websocket-server/*.log
  json.keys_under_root: true
  json.add_error_key: true

output.elasticsearch:
  hosts: ["localhost:9200"]
  index: "websocket-server-%{+yyyy.MM.dd}"
```

## Security Hardening

### 1. Rate Limiting
```typescript
// Already implemented in MessageDispatcher
const rateLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 100 // limit each connection to 100 requests per minute
});
```

### 2. Input Validation
- Sử dụng Zod schemas cho tất cả input
- Sanitize user input
- Limit message size

### 3. Authentication
```typescript
// Implement JWT authentication
const authMiddleware = async (connection: WebSocketConnection) => {
  const token = connection.getHeader('Authorization');
  if (!token) throw new Error('Unauthorized');
  
  const payload = jwt.verify(token, process.env.JWT_SECRET);
  connection.userId = payload.userId;
};
```

## Backup & Recovery

### Database Backup (if using)
```bash
# Backup Redis
redis-cli --rdb /backup/dump.rdb

# Restore Redis
cp /backup/dump.rdb /var/lib/redis/dump.rdb
systemctl restart redis
```

### Application State
- Implement state persistence
- Regular snapshots của connection state
- Graceful shutdown với state save

## Troubleshooting

### Common Issues

1. **Connection Drops**
   - Check nginx timeout settings
   - Verify keepalive configuration
   - Monitor network stability

2. **High Memory Usage**
   - Review connection limits
   - Check for memory leaks
   - Implement connection pooling

3. **Performance Issues**
   - Enable clustering
   - Add Redis for state sharing
   - Optimize message processing

### Debug Mode
```bash
# Enable debug logging
LOG_LEVEL=debug bun run start

# Trace specific modules
DEBUG=websocket:* bun run start
```

## Rollback Strategy

1. **Blue-Green Deployment**
   - Maintain two identical environments
   - Switch traffic between them
   - Quick rollback by switching back

2. **Version Tags**
   - Tag each release in git
   - Build Docker images with version tags
   - Easy rollback to previous version

3. **Database Migrations**
   - Always create backward-compatible changes
   - Test rollback procedures
   - Keep migration scripts versioned