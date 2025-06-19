import { injectable } from 'tsyringe';
import { IWebSocket, IWebSocketAdapter } from '../../application/ports/IWebSocket.ts';
import type { BunWebSocket } from './types/BunTypes.ts';

class BunWebSocketWrapper implements IWebSocket {
  constructor(private readonly ws: BunWebSocket) {}

  send(data: string): void {
    this.ws.send(data);
  }

  close(code?: number, reason?: string): void {
    this.ws.close(code, reason);
  }

  get readyState(): number {
    return this.ws.readyState;
  }

  get remoteAddress(): string | undefined {
    return this.ws.remoteAddress;
  }
}

@injectable()
export class BunWebSocketAdapter implements IWebSocketAdapter<BunWebSocket> {
  adapt(ws: BunWebSocket): IWebSocket {
    return new BunWebSocketWrapper(ws);
  }
}