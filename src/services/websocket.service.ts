// WebSocket Service for SimRule UI
// Handles real-time simulation progress updates using native WebSocket

import { apiConfig } from '@/config/api.config';
import { WS_ENDPOINTS } from '@/config/api.config';
import type { SimulationWebSocketMessage } from '@/types/api.types';

export type WebSocketStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

export interface WebSocketCallbacks {
  onMessage: (message: SimulationWebSocketMessage) => void;
  onStatusChange?: (status: WebSocketStatus) => void;
  onError?: (error: Error | Event) => void;
  onPermanentFailure?: () => void; // Called when max reconnect attempts reached
}

class SimulationWebSocket {
  private ws: WebSocket | null = null;
  private simulationId: string;
  private callbacks: WebSocketCallbacks;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private connectionTimeout = 10000; // 10 second connection timeout
  private connectionTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private status: WebSocketStatus = 'disconnected';

  constructor(simulationId: string, callbacks: WebSocketCallbacks) {
    this.simulationId = simulationId;
    this.callbacks = callbacks;
  }

  connect(): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return;
    }

    // Convert http:// to ws:// for WebSocket connection
    const wsUrl = apiConfig.wsBaseUrl.replace('http://', 'ws://').replace('https://', 'wss://');
    const fullUrl = `${wsUrl}${WS_ENDPOINTS.WS}?simulationId=${this.simulationId}`;

    console.log(`[WebSocket] Connecting to: ${fullUrl}`);
    this.setStatus('connecting');

    // Clear any existing timeout
    this.clearConnectionTimeout();

    try {
      this.ws = new WebSocket(fullUrl);

      // Set connection timeout
      this.connectionTimeoutId = setTimeout(() => {
        if (this.status === 'connecting') {
          console.warn('WebSocket connection timeout - closing and retrying');
          this.ws?.close();
          this.setStatus('error');
          this.callbacks.onError?.(new Event('timeout'));
          this.attemptReconnect();
        }
      }, this.connectionTimeout);

      this.ws.onopen = () => {
        this.clearConnectionTimeout();
        this.reconnectAttempts = 0;
        this.setStatus('connected');
      };

      this.ws.onmessage = (event) => {
        try {
          console.log('[WebSocket] Received message:', event.data);
          const message = JSON.parse(event.data) as SimulationWebSocketMessage;
          console.log('[WebSocket] Parsed message:', message);
          this.callbacks.onMessage(message);
        } catch (error) {
          console.error('[WebSocket] Failed to parse message:', error, 'Raw data:', event.data);
        }
      };

      this.ws.onerror = (error) => {
        this.clearConnectionTimeout();
        this.setStatus('error');
        this.callbacks.onError?.(error);
      };

      this.ws.onclose = (event) => {
        this.clearConnectionTimeout();
        this.setStatus('disconnected');

        // Don't reconnect if close was clean (code 1000 = normal closure)
        // This happens when backend completes the stream
        if (event.code === 1000) {
          console.log('[WebSocket] Connection closed normally by server');
          return;
        }

        this.attemptReconnect();
      };
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      this.clearConnectionTimeout();
      this.setStatus('error');
    }
  }

  private clearConnectionTimeout(): void {
    if (this.connectionTimeoutId) {
      clearTimeout(this.connectionTimeoutId);
      this.connectionTimeoutId = null;
    }
  }

  private setStatus(status: WebSocketStatus): void {
    this.status = status;
    this.callbacks.onStatusChange?.(status);
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.warn('Max reconnection attempts reached');
      // Notify UI of permanent failure so it can offer manual reconnection
      this.callbacks.onPermanentFailure?.();
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

  /**
   * Reset reconnection attempts to allow manual reconnection after failure
   */
  resetReconnectAttempts(): void {
    this.reconnectAttempts = 0;
  }

  /**
   * Manually trigger reconnection (useful after permanent failure)
   */
  reconnect(): void {
    this.resetReconnectAttempts();
    this.connect();
  }

  disconnect(): void {
    this.clearConnectionTimeout();
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

  /**
   * Manually reconnect to a simulation (useful after permanent failure)
   */
  reconnectToSimulation(simulationId: string): boolean {
    const connection = this.connections.get(simulationId);
    if (connection) {
      connection.reconnect();
      return true;
    }
    return false;
  }

  /**
   * Reset reconnection attempts for a simulation
   */
  resetReconnectAttempts(simulationId: string): void {
    const connection = this.connections.get(simulationId);
    if (connection) {
      connection.resetReconnectAttempts();
    }
  }
}

// Export singleton instance
export const websocketService = new WebSocketService();

// Export class for testing
export { WebSocketService, SimulationWebSocket };
