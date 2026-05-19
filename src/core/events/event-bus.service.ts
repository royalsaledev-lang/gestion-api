import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class EventBusService {
  constructor(private eventEmitter: EventEmitter2) {}

  emit(event: string, payload: unknown) {
    this.eventEmitter.emit(event, payload);
  }
}
