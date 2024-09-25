import { LogTransport } from '../interfaces/transport.js';

export class ConsoleTransport implements LogTransport {
  write(logMessage: string): void {
    console.log(logMessage);
  }
}
