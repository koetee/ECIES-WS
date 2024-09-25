import { LogFormatter } from '../interfaces/formatter.js';
import { LogLevel } from '../interfaces/logger.js';

export class JsonFormatter implements LogFormatter {
  format(
    level: LogLevel,
    message: string,
    context: Record<string, unknown> = {},
  ): string {
    const logObject = {
      level,
      message,
      context,
      timestamp: new Date().toISOString(),
    };
    return JSON.stringify(logObject);
  }
}
