export interface IWebSocketClient {
  connect(): void;
  disconnect(): void;
  isConnected(): boolean;
  on(event: string | symbol, listener: (...args: any[]) => void): this;
  off(event: string | symbol, listener: (...args: any[]) => void): this;
  emit(event: string | symbol, ...args: any[]): boolean;
}