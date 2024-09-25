export interface LogTransport {
  write(logMessage: string): void;
}
