import { describe, it, expect, vi } from 'vitest';
import {
  JsonFormatter,
  ConsoleTransport,
  Slog,
  LogLevelFilter,
} from '../../modules/slog/index.js';

describe('Slog', () => {
  it('should log message with appropriate format and transport', () => {
    const formatter = new JsonFormatter();
    const transport = new ConsoleTransport();
    const filter = new LogLevelFilter('info');

    const logger = new Slog(formatter, transport, filter);

    const spy = vi.spyOn(console, 'log');

    logger.info('Test log message');

    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining('Test log message'),
    );
    spy.mockRestore();
  });

  it('should not log messages below the set log level', () => {
    const formatter = new JsonFormatter();
    const transport = new ConsoleTransport();
    const filter = new LogLevelFilter('warn');

    const logger = new Slog(formatter, transport, filter);

    const spy = vi.spyOn(console, 'log');

    logger.info('This should not be logged');
    expect(spy).not.toHaveBeenCalled();

    spy.mockRestore();
  });
});
