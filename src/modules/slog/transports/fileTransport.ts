import { LogTransport } from '../interfaces/transport.js';
import fs from 'fs';

export class FileTransport implements LogTransport {
  private filePath: string;

  constructor(filePath: string) {
    this.filePath = filePath;
  }

  write(logMessage: string): void {
    fs.appendFileSync(this.filePath, logMessage + '\n');
  }
}
