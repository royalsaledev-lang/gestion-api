import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class LoggerService extends Logger {
  logAction(action: string, context?: string) {
    this.log(`[ACTION] ${action}`, context);
  }

  errorAction(error: string, context?: string) {
    this.error(`[ERROR] ${error}`, context);
  }

  warnAction(message: string, context?: string) {
    this.warn(`[WARN] ${message}`, context);
  }
}
