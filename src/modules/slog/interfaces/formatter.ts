import { LogLevel } from './logger.js';

export interface LogFormatter {
  format(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>,
  ): string;
}
