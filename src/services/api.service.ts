// Base API Service for SimRule UI
// Provides core HTTP functionality with error handling, retries, and correlation tracking

import { apiConfig, getDefaultHeaders, getActuatorBaseUrl } from '@/config/api.config';

export interface ApiError {
  status: number;
  message: string;
  details?: unknown;
  correlationId?: string;
}

export interface RequestOptions {
  headers?: Record<string, string>;
  correlationId?: string;
  userId?: string;
  timeout?: number;
  signal?: AbortSignal;
}

class ApiService {
  private baseUrl: string;
  private defaultTimeout: number;

  constructor() {
    this.baseUrl = apiConfig.baseUrl;
    this.defaultTimeout = apiConfig.timeout;
  }

  private async handleResponse<T>(response: Response, method: string, url: string): Promise<T> {
    if (!response.ok) {
      const errorBody = await response.text();
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      let errorDetails: unknown;

      try {
        const parsedError = JSON.parse(errorBody);
        errorMessage = parsedError.message || errorMessage;
        errorDetails = parsedError;
      } catch {
        errorDetails = errorBody;
      }

      const correlationId = response.headers.get('X-Correlation-ID') || undefined;

      // Log the error for debugging
      console.error(`[API Error] ${method} ${url}`, {
        status: response.status,
        message: errorMessage,
        correlationId,
        details: errorDetails,
      });

      const error: ApiError = {
        status: response.status,
        message: errorMessage,
        details: errorDetails,
        correlationId,
      };

      throw error;
    }

    // Handle empty responses
    const contentType = response.headers.get('Content-Type');
    if (!contentType || !contentType.includes('application/json')) {
      return {} as T;
    }

    const text = await response.text();
    if (!text) {
      return {} as T;
    }

    return JSON.parse(text) as T;
  }

  private createTimeoutSignal(
    timeout: number,
    existingSignal?: AbortSignal
  ): { signal: AbortSignal; cleanup: () => void } {
    const controller = new AbortController();

    const timeoutId = setTimeout(() => {
      controller.abort(new Error('Request timeout'));
    }, timeout);

    const cleanup = () => {
      clearTimeout(timeoutId);
    };

    if (existingSignal) {
      existingSignal.addEventListener('abort', () => {
        cleanup();
        controller.abort(existingSignal.reason);
      });
    }

    return { signal: controller.signal, cleanup };
  }

  async get<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      ...getDefaultHeaders(options.correlationId, options.userId),
      ...options.headers,
    };

    const { signal, cleanup } = this.createTimeoutSignal(
      options.timeout || this.defaultTimeout,
      options.signal
    );

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers,
        signal,
      });

      return this.handleResponse<T>(response, 'GET', url);
    } catch (error) {
      // Log network errors and timeouts
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error(`[API Network Error] GET ${url}`, error.message);
      }
      throw error;
    } finally {
      cleanup();
    }
  }

  async post<T, B = unknown>(endpoint: string, body: B, options: RequestOptions = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      ...getDefaultHeaders(options.correlationId, options.userId),
      ...options.headers,
    };

    const { signal, cleanup } = this.createTimeoutSignal(
      options.timeout || this.defaultTimeout,
      options.signal
    );

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal,
      });

      return this.handleResponse<T>(response, 'POST', url);
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error(`[API Network Error] POST ${url}`, error.message);
      }
      throw error;
    } finally {
      cleanup();
    }
  }

  async put<T, B = unknown>(endpoint: string, body: B, options: RequestOptions = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      ...getDefaultHeaders(options.correlationId, options.userId),
      ...options.headers,
    };

    const { signal, cleanup } = this.createTimeoutSignal(
      options.timeout || this.defaultTimeout,
      options.signal
    );

    try {
      const response = await fetch(url, {
        method: 'PUT',
        headers,
        body: JSON.stringify(body),
        signal,
      });

      return this.handleResponse<T>(response, 'PUT', url);
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error(`[API Network Error] PUT ${url}`, error.message);
      }
      throw error;
    } finally {
      cleanup();
    }
  }

  async delete<T = void>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      ...getDefaultHeaders(options.correlationId, options.userId),
      ...options.headers,
    };

    const { signal, cleanup } = this.createTimeoutSignal(
      options.timeout || this.defaultTimeout,
      options.signal
    );

    try {
      const response = await fetch(url, {
        method: 'DELETE',
        headers,
        signal,
      });

      return this.handleResponse<T>(response, 'DELETE', url);
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error(`[API Network Error] DELETE ${url}`, error.message);
      }
      throw error;
    } finally {
      cleanup();
    }
  }

  // Health check
  async checkHealth(): Promise<{ status: string }> {
    const { signal, cleanup } = this.createTimeoutSignal(5000);
    try {
      const actuatorUrl = getActuatorBaseUrl();
      const response = await fetch(`${actuatorUrl}/actuator/health`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal,
      });

      if (!response.ok) {
        return { status: 'DOWN' };
      }

      const data = await response.json();
      return { status: data.status || 'UNKNOWN' };
    } catch {
      return { status: 'DOWN' };
    } finally {
      cleanup();
    }
  }

  // Update base URL (for settings)
  setBaseUrl(url: string): void {
    this.baseUrl = url;
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }
}

// Export singleton instance
export const apiService = new ApiService();

// Export class for testing
export { ApiService };
