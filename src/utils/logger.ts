/**
 * Logger utility for structured logging with trace IDs
 */

// Log levels
export enum LogLevel {
  DEBUG = "DEBUG",
  INFO = "INFO",
  WARN = "WARN",
  ERROR = "ERROR",
}

// Log entry interface
export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  traceId?: string;
  [key: string]: unknown;
}

/**
 * Create a new logger with optional default context
 */
export const createLogger = (defaultContext: Record<string, unknown> = {}) => {
  // Return logger methods
  return {
    debug: (message: string, context: Record<string, unknown> = {}): void => {
      log(LogLevel.DEBUG, message, { ...defaultContext, ...context });
    },

    info: (message: string, context: Record<string, unknown> = {}): void => {
      log(LogLevel.INFO, message, { ...defaultContext, ...context });
    },

    warn: (message: string, context: Record<string, unknown> = {}): void => {
      log(LogLevel.WARN, message, { ...defaultContext, ...context });
    },

    error: (message: string, context: Record<string, unknown> = {}): void => {
      log(LogLevel.ERROR, message, { ...defaultContext, ...context });
    },
  };
};

/**
 * Core logging function
 */
function log(
  level: LogLevel,
  message: string,
  context: Record<string, unknown> = {},
): void {
  const timestamp = new Date().toISOString();

  const logEntry: LogEntry = {
    timestamp,
    level,
    message,
    ...context,
  };

  // In production, you might want to send logs to a service
  // For now, just output to console with proper formatting
  switch (level) {
    case LogLevel.DEBUG:
      console.debug(formatLogEntry(logEntry));
      break;
    case LogLevel.INFO:
      console.info(formatLogEntry(logEntry));
      break;
    case LogLevel.WARN:
      console.warn(formatLogEntry(logEntry));
      break;
    case LogLevel.ERROR:
      console.error(formatLogEntry(logEntry));
      break;
  }
}

/**
 * Format log entry as a string for console output
 */
function formatLogEntry(entry: LogEntry): string {
  const { timestamp, level, message, traceId, ...rest } = entry;

  // Format the traceId part if it exists
  const traceIdPart = traceId ? `[${traceId}] ` : "";

  // Format the basic log message
  let formattedLog = `${timestamp} ${level} ${traceIdPart}${message}`;

  // Add additional context if it exists
  if (Object.keys(rest).length > 0) {
    formattedLog += ` ${JSON.stringify(rest)}`;
  }

  return formattedLog;
}

/**
 * Generate a random trace ID
 */
export function generateTraceId(): string {
  return Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15);
}

// Create default logger instance
export const logger = createLogger();
