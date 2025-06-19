export interface IWebSocket {
  send(data: string): void;
  close(code?: number, reason?: string): void;
  readonly readyState: number;
  readonly remoteAddress?: string;
}

export interface IWebSocketAdapter<T = unknown> {
  adapt(ws: T): IWebSocket;
}