export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface Logger {
  log(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>,
  ): void;
  debug(message: string, context?: Record<string, unknown>): void;
  info(message: string, context?: Record<string, unknown>): void;
  warn(message: string, context?: Record<string, unknown>): void;
  error(message: string, context?: Record<string, unknown>): void;
}
