// Centralized logging utility for SimRule UI
// Environment-aware logging with structured output and correlation ID tracking

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4,
}

export class Logger {
  private level: LogLevel;
  private enabled: boolean;

  constructor() {
    // Read from environment variable or localStorage override
    const envLevel = import.meta.env.VITE_LOG_LEVEL || (import.meta.env.DEV ? 'debug' : 'error');
    const storageOverride = localStorage.getItem('simrule-log-level');
    this.level = this.parseLevel(storageOverride || envLevel);

    // Enable logging in dev mode or if explicitly enabled
    this.enabled = import.meta.env.DEV || localStorage.getItem('simrule-debug-mode') === 'true';
  }

  private parseLevel(level: string): LogLevel {
    const levelMap: Record<string, LogLevel> = {
      debug: LogLevel.DEBUG,
      info: LogLevel.INFO,
      warn: LogLevel.WARN,
      error: LogLevel.ERROR,
      none: LogLevel.NONE,
    };
    return levelMap[level.toLowerCase()] ?? LogLevel.INFO;
  }

  private shouldLog(level: LogLevel): boolean {
    return this.enabled && level >= this.level;
  }

  private formatTimestamp(): string {
    const now = new Date();
    return now.toISOString().replace('T', ' ').substring(0, 19);
  }

  private formatMessage(level: string, context: string, message: string): string {
    return `[${this.formatTimestamp()}] [${level}] [${context}] ${message}`;
  }

  debug(context: string, message: string, data?: unknown): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return;

    const formatted = this.formatMessage('DEBUG', context, message);
    if (data !== undefined) {
      console.log(formatted, data);
    } else {
      console.log(formatted);
    }
  }

  info(context: string, message: string, data?: unknown): void {
    if (!this.shouldLog(LogLevel.INFO)) return;

    const formatted = this.formatMessage('INFO', context, message);
    if (data !== undefined) {
      console.info(formatted, data);
    } else {
      console.info(formatted);
    }
  }

  warn(context: string, message: string, data?: unknown): void {
    if (!this.shouldLog(LogLevel.WARN)) return;

    const formatted = this.formatMessage('WARN', context, message);
    if (data !== undefined) {
      console.warn(formatted, data);
    } else {
      console.warn(formatted);
    }
  }

  error(context: string, message: string, error?: unknown): void {
    if (!this.shouldLog(LogLevel.ERROR)) return;

    const formatted = this.formatMessage('ERROR', context, message);
    if (error !== undefined) {
      console.error(formatted, error);
    } else {
      console.error(formatted);
    }
  }

  logApiRequest(
    context: string,
    method: string,
    url: string,
    payload?: unknown,
    headers?: Record<string, string>
  ): void {
    if (!this.shouldLog(LogLevel.INFO)) return;

    const correlationId = headers?.['X-Correlation-ID'] || 'N/A';
    console.group(`📤 ${method} ${url}`);
    console.info(`[${this.formatTimestamp()}] [INFO] [${context}] API Request`);
    console.info(`  ├─ Correlation-ID: ${correlationId}`);

    if (headers && Object.keys(headers).length > 0) {
      console.info('  ├─ Headers:', headers);
    }

    if (payload !== undefined) {
      console.info('  └─ Payload:', this.formatPayload(payload));
    }
    console.groupEnd();
  }

  logApiResponse(
    context: string,
    method: string,
    url: string,
    status: number,
    data?: unknown,
    correlationId?: string
  ): void {
    if (!this.shouldLog(LogLevel.INFO)) return;

    const statusText = this.getStatusText(status);
    console.group(`📥 ${method} ${url} - ${status} ${statusText}`);
    console.info(`[${this.formatTimestamp()}] [INFO] [${context}] API Response`);

    if (correlationId) {
      console.info(`  ├─ Correlation-ID: ${correlationId}`);
    }

    if (data !== undefined) {
      console.info('  └─ Response:', data);
    }
    console.groupEnd();
  }

  group(label: string, callback: () => void): void {
    if (!this.shouldLog(LogLevel.DEBUG)) {
      callback();
      return;
    }

    console.group(label);
    try {
      callback();
    } finally {
      console.groupEnd();
    }
  }

  private formatPayload(payload: unknown): unknown {
    // Return payload as-is for console to handle formatting
    return payload;
  }

  private getStatusText(status: number): string {
    const statusTexts: Record<number, string> = {
      200: 'OK',
      201: 'Created',
      204: 'No Content',
      400: 'Bad Request',
      401: 'Unauthorized',
      403: 'Forbidden',
      404: 'Not Found',
      500: 'Internal Server Error',
      502: 'Bad Gateway',
      503: 'Service Unavailable',
    };
    return statusTexts[status] || '';
  }

  isDebugEnabled(): boolean {
    return this.shouldLog(LogLevel.DEBUG);
  }

  setLevel(level: string): void {
    this.level = this.parseLevel(level);
    localStorage.setItem('simrule-log-level', level);
  }
}

// Export singleton instance
export const logger = new Logger();
