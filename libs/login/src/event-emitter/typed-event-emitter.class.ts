import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EventPayloads } from '@login/login/interfaces/event-types.interface';

@Injectable()
export class TypedEventEmitter {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  emit<K extends keyof EventPayloads>(event: K, payload: EventPayloads[K]): boolean {
    return this.eventEmitter.emit(event, payload);
  }

  emitAsync<K extends keyof EventPayloads>(
    event: K,
    payload: EventPayloads[K]
  ): Promise<boolean[]> {
    return this.eventEmitter.emitAsync(event, payload);
  }
}
