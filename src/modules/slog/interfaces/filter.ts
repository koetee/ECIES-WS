import { LogLevel } from './logger.js';

export interface LogFilter {
  shouldLog(level: LogLevel): boolean;
}
