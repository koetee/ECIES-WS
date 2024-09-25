import {
  Logger,
  LogFormatter,
  LogTransport,
  LogFilter,
  LogLevel,
} from './index.js';

export class Slog implements Logger {
  private formatter: LogFormatter;
  private transport: LogTransport;
  private filter: LogFilter;

  constructor(
    formatter: LogFormatter,
    transport: LogTransport,
    filter: LogFilter,
  ) {
    this.formatter = formatter;
    this.transport = transport;
    this.filter = filter;
  }

  log(
    level: LogLevel,
    message: string,
    context: Record<string, unknown> = {},
  ): void {
    if (this.filter.shouldLog(level)) {
      const formattedMessage = this.formatter.format(level, message, context);
      this.transport.write(formattedMessage);
    }
  }

  debug(message: string, context?: Record<string, unknown>): void {
    this.log('debug', message, context);
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.log('warn', message, context);
  }

  error(message: string, context?: Record<string, unknown>): void {
    this.log('error', message, context);
  }
}
