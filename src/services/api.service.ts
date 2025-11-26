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

  private async handleResponse<T>(response: Response): Promise<T> {
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

      const error: ApiError = {
        status: response.status,
        message: errorMessage,
        details: errorDetails,
        correlationId: response.headers.get('X-Correlation-ID') || undefined,
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

  private createTimeoutSignal(timeout: number, existingSignal?: AbortSignal): AbortSignal {
    const controller = new AbortController();

    const timeoutId = setTimeout(() => {
      controller.abort(new Error('Request timeout'));
    }, timeout);

    if (existingSignal) {
      existingSignal.addEventListener('abort', () => {
        clearTimeout(timeoutId);
        controller.abort(existingSignal.reason);
      });
    }

    return controller.signal;
  }

  async get<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      ...getDefaultHeaders(options.correlationId, options.userId),
      ...options.headers,
    };

    const signal = this.createTimeoutSignal(
      options.timeout || this.defaultTimeout,
      options.signal
    );

    const response = await fetch(url, {
      method: 'GET',
      headers,
      signal,
    });

    return this.handleResponse<T>(response);
  }

  async post<T, B = unknown>(endpoint: string, body: B, options: RequestOptions = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      ...getDefaultHeaders(options.correlationId, options.userId),
      ...options.headers,
    };

    const signal = this.createTimeoutSignal(
      options.timeout || this.defaultTimeout,
      options.signal
    );

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal,
    });

    return this.handleResponse<T>(response);
  }

  async put<T, B = unknown>(endpoint: string, body: B, options: RequestOptions = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      ...getDefaultHeaders(options.correlationId, options.userId),
      ...options.headers,
    };

    const signal = this.createTimeoutSignal(
      options.timeout || this.defaultTimeout,
      options.signal
    );

    const response = await fetch(url, {
      method: 'PUT',
      headers,
      body: JSON.stringify(body),
      signal,
    });

    return this.handleResponse<T>(response);
  }

  async delete<T = void>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      ...getDefaultHeaders(options.correlationId, options.userId),
      ...options.headers,
    };

    const signal = this.createTimeoutSignal(
      options.timeout || this.defaultTimeout,
      options.signal
    );

    const response = await fetch(url, {
      method: 'DELETE',
      headers,
      signal,
    });

    return this.handleResponse<T>(response);
  }

  // Health check
  async checkHealth(): Promise<{ status: string }> {
    try {
      const actuatorUrl = getActuatorBaseUrl();
      const response = await fetch(`${actuatorUrl}/actuator/health`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: this.createTimeoutSignal(5000),
      });

      if (!response.ok) {
        return { status: 'DOWN' };
      }

      const data = await response.json();
      return { status: data.status || 'UNKNOWN' };
    } catch {
      return { status: 'DOWN' };
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
