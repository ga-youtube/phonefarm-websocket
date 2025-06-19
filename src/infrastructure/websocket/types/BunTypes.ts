// Bun WebSocket types - using Bun's actual ServerWebSocket type
import type { ServerWebSocket } from 'bun';

export type BunWebSocket = ServerWebSocket<unknown>;

export interface BunServer {
  upgrade(request: Request): boolean;
  stop(): void;
}

export interface BunWebSocketHandler {
  message?: (ws: BunWebSocket, message: string | ArrayBuffer) => void | Promise<void>;
  open?: (ws: BunWebSocket) => void | Promise<void>;
  close?: (ws: BunWebSocket, code: number, reason: string) => void | Promise<void>;
  error?: (ws: BunWebSocket, error: Error) => void | Promise<void>;
}

export interface BunServeOptions {
  port?: number;
  hostname?: string;
  fetch: (request: Request) => Response | Promise<Response> | undefined;
  websocket?: BunWebSocketHandler;
}