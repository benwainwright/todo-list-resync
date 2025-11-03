export interface EmittedEvent<TEventName extends keyof globalThis.Events> {
  name: TEventName;
  data: globalThis.Events[TEventName];
}
