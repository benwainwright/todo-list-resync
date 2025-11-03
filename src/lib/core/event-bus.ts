import { EventEmitter as NodeEventEmitter } from "node:events";
import type { EventEmitter } from "@types";
import { EVENT_BUS_KEY } from "@constants";

interface EventEmission<TEventName extends keyof globalThis.Events> {
  name: TEventName;
  data: globalThis.Events[TEventName];
}

export class EventBus implements EventEmitter {
  private emitter = new NodeEventEmitter();
  public async emit<TEventName extends keyof globalThis.Events>(
    name: TEventName,
    ...args: globalThis.Events[TEventName] extends undefined
      ? []
      : [data: globalThis.Events[TEventName]]
  ) {
    this.emitter.emit(EVENT_BUS_KEY, { name, args });
  }

  public async onAll<
    TEventName extends keyof globalThis.Events = keyof globalThis.Events,
  >(callback: (data: EventEmission<TEventName>) => void) {
    this.emitter.on(EVENT_BUS_KEY, callback);
  }

  public async on<TEventName extends keyof globalThis.Events>(
    name: TEventName,
    callback: (data: globalThis.Events[TEventName]) => void,
  ) {
    this.emitter.on(EVENT_BUS_KEY, (data: EventEmission<TEventName>) => {
      if (data.name === name) {
        callback(data.data);
      }
    });
  }
}
