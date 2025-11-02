export interface EventEmitter {
  emit: <TEventName extends keyof Events>(
    name: TEventName,
    ...args: Events[TEventName] extends undefined
      ? []
      : [data: Events[TEventName]]
  ) => void;

  on: <TEventName extends keyof Events>(
    name: TEventName,
    callback: (data: Events[TEventName]) => void,
  ) => void;
}
