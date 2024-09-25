import { LogFormatter } from '../interfaces/formatter.js';
import { LogLevel } from '../interfaces/logger.js';

export class TextFormatter implements LogFormatter {
  format(
    level: LogLevel,
    message: string,
    context: Record<string, unknown> = {},
  ): string {
    const timestamp = new Date().toISOString();
    const contextString = Object.keys(context).length
      ? JSON.stringify(context)
      : '';
    return `${timestamp} [${level.toUpperCase()}]: ${message} ${contextString}`;
  }
}
