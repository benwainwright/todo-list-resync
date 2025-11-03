import { EventEmitter as NodeEventEmitter } from "node:events";
import type { EmittedEvent, EventEmitter } from "@types";
import { EVENT_BUS_KEY } from "@constants";

export class EventBus implements EventEmitter {
  private emitter = new NodeEventEmitter();
  public emit<TEventName extends keyof globalThis.Events>(
    name: TEventName,
    ...args: globalThis.Events[TEventName] extends undefined
      ? []
      : [data: globalThis.Events[TEventName]]
  ) {
    this.emitter.emit(EVENT_BUS_KEY, { name, data: args[0] });
  }

  public onAll<
    TEventName extends keyof globalThis.Events = keyof globalThis.Events,
  >(callback: (data: EmittedEvent<TEventName>) => void) {
    this.emitter.on(EVENT_BUS_KEY, callback);
  }

  public async on<TEventName extends keyof globalThis.Events>(
    name: TEventName,
    callback: (data: globalThis.Events[TEventName]) => void,
  ) {
    this.emitter.on(EVENT_BUS_KEY, (data: EmittedEvent<TEventName>) => {
      if (data.name === name) {
        callback(data.data);
      }
    });
  }
}
