import { LogFilter } from '../interfaces/filter.js';
import { LogLevel } from '../interfaces/logger.js';

export class LogLevelFilter implements LogFilter {
  private level: LogLevel;

  constructor(level: LogLevel) {
    this.level = level;
  }

  shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    return levels.indexOf(level) >= levels.indexOf(this.level);
  }
}
