export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  feature?: string;
  action?: string;
  errorCode?: string;
  [key: string]: unknown;
}

export class Logger {
  private static formatMessage(level: LogLevel, contextTag: string, message: string): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level.toUpperCase()}] [${contextTag}] ${message}`;
  }

  private static isDev(): boolean {
    const globalObj = globalThis as { process?: { env?: { NODE_ENV?: string } } };
    return globalObj.process?.env?.NODE_ENV === 'development';
  }

  public static debug(contextTag: string, message: string, context?: LogContext): void {
    if (Logger.isDev()) {
      if (context) {
        console.debug(Logger.formatMessage('debug', contextTag, message), context);
      } else {
        console.debug(Logger.formatMessage('debug', contextTag, message));
      }
    }
  }

  public static info(contextTag: string, message: string, context?: LogContext): void {
    if (context) {
      console.info(Logger.formatMessage('info', contextTag, message), context);
    } else {
      console.info(Logger.formatMessage('info', contextTag, message));
    }
  }

  public static warn(contextTag: string, message: string, context?: LogContext): void {
    if (context) {
      console.warn(Logger.formatMessage('warn', contextTag, message), context);
    } else {
      console.warn(Logger.formatMessage('warn', contextTag, message));
    }
  }

  public static error(contextTag: string, message: string, error?: unknown, context?: LogContext): void {
    if (error && context) {
      console.error(Logger.formatMessage('error', contextTag, message), error, context);
    } else if (error) {
      console.error(Logger.formatMessage('error', contextTag, message), error);
    } else if (context) {
      console.error(Logger.formatMessage('error', contextTag, message), context);
    } else {
      console.error(Logger.formatMessage('error', contextTag, message));
    }
  }
}
