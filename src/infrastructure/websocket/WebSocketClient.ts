import { io, Socket } from 'socket.io-client';
import { EventEmitter } from 'events';
import type { IWebSocketClient } from '@/domain/interfaces/IWebSocketClient';

export class WebSocketClient extends EventEmitter implements IWebSocketClient {
  private socket: Socket | null = null;
  private isConnecting: boolean = false;
  private reconnectInterval: NodeJS.Timeout | null = null;
  private readonly apiUrl: string;
  private readonly reconnectDelay: number = 5000;
  
  constructor(apiUrl: string) {
    super();
    this.apiUrl = apiUrl;
  }
  
  public connect(): void {
    if (this.isConnected() || this.isConnecting) {
      return;
    }
    
    this.isConnecting = true;
    
    try {
      console.log('Conectando à Evolution API...');
        console.log('URL da API:', this.apiUrl);
      this.socket = io(this.apiUrl, {
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000
      });
      
      this.setupSocketListeners();
    } catch (error) {
      console.error('Erro ao conectar à Evolution API:', error);
      this.scheduleReconnect();
    } finally {
      this.isConnecting = false;
    }
  }
  
  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    
    this.clearReconnectInterval();
  }
  
  public isConnected(): boolean {
    return this.socket?.connected || false;
  }
  
  private setupSocketListeners(): void {
    if (!this.socket) return;
    
    // Eventos básicos de conexão
    this.socket.on('connect', () => {
      console.log('Conectado à Evolution API');
      this.emit('connected');
    });
    
    this.socket.on('disconnect', (reason) => {
      console.log(`Desconectado da Evolution API. Razão: ${reason}`);
      this.emit('disconnected', reason);
      
      if (reason === 'io server disconnect' || reason === 'transport close') {
        this.scheduleReconnect();
      }
    });
    
    this.socket.on('connect_error', (error) => {
      console.error('Erro de conexão com Evolution API:', error);
      this.emit('error', error);
      this.scheduleReconnect();
    });
    
    // Ouvir o evento de mensagens da Evolution API
    this.socket.on('messages.upsert', (data) => {
      console.log('Evento messages.upsert recebido');
      this.emit('message', data);
    });
    
    // Outros eventos relevantes da Evolution API
    this.socket.on('connection.update', (update) => {
      console.log('Status de conexão atualizado:', update);
      this.emit('connectionUpdate', update);
    });
  }
  
  private scheduleReconnect(): void {
    this.clearReconnectInterval();
    
    this.reconnectInterval = setTimeout(() => {
      console.log('Tentando reconectar à Evolution API...');
      this.connect();
    }, this.reconnectDelay);
  }
  
  private clearReconnectInterval(): void {
    if (this.reconnectInterval) {
      clearTimeout(this.reconnectInterval);
      this.reconnectInterval = null;
    }
  }
}