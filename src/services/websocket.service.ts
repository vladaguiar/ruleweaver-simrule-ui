// WebSocket Service for SimRule UI
// Handles real-time simulation progress updates

import { apiConfig } from '@/config/api.config';
import { WS_ENDPOINTS } from '@/config/api.config';
import type { SimulationWebSocketMessage } from '@/types/api.types';

export type WebSocketStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

export interface WebSocketCallbacks {
  onMessage: (message: SimulationWebSocketMessage) => void;
  onStatusChange?: (status: WebSocketStatus) => void;
  onError?: (error: Event) => void;
}

class SimulationWebSocket {
  private ws: WebSocket | null = null;
  private simulationId: string;
  private callbacks: WebSocketCallbacks;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private status: WebSocketStatus = 'disconnected';

  constructor(simulationId: string, callbacks: WebSocketCallbacks) {
    this.simulationId = simulationId;
    this.callbacks = callbacks;
  }

  connect(): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return;
    }

    const wsUrl = `${apiConfig.wsBaseUrl}${WS_ENDPOINTS.SIMULATION(this.simulationId)}`;
    this.setStatus('connecting');

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        this.setStatus('connected');
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as SimulationWebSocketMessage;
          this.callbacks.onMessage(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      this.ws.onerror = (error) => {
        this.setStatus('error');
        this.callbacks.onError?.(error);
      };

      this.ws.onclose = () => {
        this.setStatus('disconnected');
        this.attemptReconnect();
      };
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      this.setStatus('error');
    }
  }

  private setStatus(status: WebSocketStatus): void {
    this.status = status;
    this.callbacks.onStatusChange?.(status);
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.warn('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    setTimeout(() => {
      if (this.status === 'disconnected') {
        this.connect();
      }
    }, delay);
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.setStatus('disconnected');
    this.reconnectAttempts = this.maxReconnectAttempts; // Prevent auto-reconnect
  }

  getStatus(): WebSocketStatus {
    return this.status;
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

class WebSocketService {
  private connections: Map<string, SimulationWebSocket> = new Map();

  /**
   * Connect to simulation WebSocket for real-time progress updates
   */
  connectToSimulation(
    simulationId: string,
    callbacks: WebSocketCallbacks
  ): SimulationWebSocket {
    // Close existing connection if any
    this.disconnectFromSimulation(simulationId);

    const connection = new SimulationWebSocket(simulationId, callbacks);
    this.connections.set(simulationId, connection);
    connection.connect();

    return connection;
  }

  /**
   * Disconnect from simulation WebSocket
   */
  disconnectFromSimulation(simulationId: string): void {
    const connection = this.connections.get(simulationId);
    if (connection) {
      connection.disconnect();
      this.connections.delete(simulationId);
    }
  }

  /**
   * Disconnect all WebSocket connections
   */
  disconnectAll(): void {
    this.connections.forEach((connection) => {
      connection.disconnect();
    });
    this.connections.clear();
  }

  /**
   * Get connection status for a simulation
   */
  getConnectionStatus(simulationId: string): WebSocketStatus | null {
    const connection = this.connections.get(simulationId);
    return connection?.getStatus() || null;
  }

  /**
   * Check if connected to a simulation
   */
  isConnected(simulationId: string): boolean {
    const connection = this.connections.get(simulationId);
    return connection?.isConnected() || false;
  }
}

// Export singleton instance
export const websocketService = new WebSocketService();

// Export class for testing
export { WebSocketService, SimulationWebSocket };
