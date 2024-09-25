import { describe, it, expect, vi } from 'vitest';
import {
  JsonFormatter,
  ConsoleTransport,
  Slog,
  LogLevelFilter,
  FileTransport,
  TextFormatter,
} from '../../modules/slog/index.js';
import fs from 'fs';

describe('Slog', () => {
  it('should log error messages', () => {
    const formatter = new JsonFormatter();
    const transport = new ConsoleTransport();
    const filter = new LogLevelFilter('error');

    const logger = new Slog(formatter, transport, filter);

    const spy = vi.spyOn(console, 'log');

    logger.error('Test error message');

    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining('Test error message'),
    );
    spy.mockRestore();
  });

  // Test case for using TextFormatter instead of JsonFormatter
  it('should log messages with TextFormatter', () => {
    const formatter = new TextFormatter();
    const transport = new ConsoleTransport();
    const filter = new LogLevelFilter('info');

    const logger = new Slog(formatter, transport, filter);

    const spy = vi.spyOn(console, 'log');

    logger.info('TextFormatter log message');

    expect(spy).toHaveBeenCalledWith(expect.stringContaining('[INFO]'));
    spy.mockRestore();
  });

  // Test case for logging to a file
  it('should log messages to a file', () => {
    const filePath = 'test.log';
    const formatter = new JsonFormatter();
    const transport = new FileTransport(filePath);
    const filter = new LogLevelFilter('info');

    const logger = new Slog(formatter, transport, filter);

    // Ensure the file is clean before the test
    fs.writeFileSync(filePath, '');

    logger.info('Log message to file');

    const fileContent = fs.readFileSync(filePath, 'utf-8');
    expect(fileContent).toContain('Log message to file');

    // Clean up the test log file
    fs.unlinkSync(filePath);
  });

  // Test case for logging with different log levels
  it('should respect log level filtering', () => {
    const formatter = new TextFormatter();
    const transport = new ConsoleTransport();
    const filter = new LogLevelFilter('warn');

    const logger = new Slog(formatter, transport, filter);

    const spy = vi.spyOn(console, 'log');

    logger.debug('This should not be logged');
    logger.info('This should not be logged');
    logger.warn('This should be logged');
    logger.error('This should be logged too');

    expect(spy).toHaveBeenCalledTimes(2);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('WARN'));
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('ERROR'));
    spy.mockRestore();
  });

  // Test case for logging large messages
  it('should handle large log messages', () => {
    const formatter = new JsonFormatter();
    const transport = new ConsoleTransport();
    const filter = new LogLevelFilter('info');

    const logger = new Slog(formatter, transport, filter);

    const largeMessage = 'A'.repeat(10000); // 10,000 characters
    const spy = vi.spyOn(console, 'log');

    logger.info(largeMessage);

    expect(spy).toHaveBeenCalledWith(expect.stringContaining(largeMessage));
    spy.mockRestore();
  });

  // Test case for throwing an error if filter rejects all levels
  it('should not log anything if filter excludes all log levels', () => {
    const formatter = new JsonFormatter();
    const transport = new ConsoleTransport();
    const filter = new LogLevelFilter('error'); // Only log errors

    const logger = new Slog(formatter, transport, filter);

    const spy = vi.spyOn(console, 'log');

    logger.debug('Debug message');
    logger.info('Info message');
    logger.warn('Warn message');

    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  // Test case for multiple transports (console and file)
  it('should log to multiple transports', () => {
    const filePath = 'test-multi.log';
    const formatter = new JsonFormatter();
    const consoleTransport = new ConsoleTransport();
    const fileTransport = new FileTransport(filePath);
    const filter = new LogLevelFilter('info');

    const logger = new Slog(
      formatter,
      {
        write(logMessage: string): void {
          consoleTransport.write(logMessage);
          fileTransport.write(logMessage);
        },
      },
      filter,
    );

    // Ensure the file is clean before the test
    fs.writeFileSync(filePath, '');

    const spy = vi.spyOn(console, 'log');

    logger.info('Log message to multiple transports');

    const fileContent = fs.readFileSync(filePath, 'utf-8');
    expect(fileContent).toContain('Log message to multiple transports');
    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining('Log message to multiple transports'),
    );

    // Clean up
    fs.unlinkSync(filePath);
    spy.mockRestore();
  });

  // Test case for logging with context data
  it('should log with context data', () => {
    const formatter = new JsonFormatter();
    const transport = new ConsoleTransport();
    const filter = new LogLevelFilter('info');

    const logger = new Slog(formatter, transport, filter);

    const spy = vi.spyOn(console, 'log');

    logger.info('Message with context', { userId: 123, operation: 'update' });

    expect(spy).toHaveBeenCalledWith(expect.stringContaining('"userId":123'));
    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining('"operation":"update"'),
    );
    spy.mockRestore();
  });

  // Test case for logging different formats (JSON and Text)
  it('should support different formats for different transports', () => {
    const jsonFormatter = new JsonFormatter();
    const textFormatter = new TextFormatter();
    const consoleTransport = new ConsoleTransport();
    const filePath = 'test-format.log';
    const fileTransport = new FileTransport(filePath);
    const filter = new LogLevelFilter('info');

    const logger = new Slog(jsonFormatter, consoleTransport, filter);

    // Log with JSON formatter to console
    const consoleSpy = vi.spyOn(console, 'log');
    logger.info('Log message in JSON format');

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('"message":"Log message in JSON format"'),
    );

    // Log with Text formatter to file
    logger['formatter'] = textFormatter; // Temporarily change formatter
    logger['transport'] = fileTransport; // Temporarily change transport

    logger.info('Log message in Text format');

    const fileContent = fs.readFileSync(filePath, 'utf-8');
    expect(fileContent).toContain('Log message in Text format');

    // Clean up
    fs.unlinkSync(filePath);
    consoleSpy.mockRestore();
  });
});
