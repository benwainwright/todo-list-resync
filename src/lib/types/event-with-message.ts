import type { AppEvent } from "./app-event.ts";

export type EventsWithMessages<T> = { [K in keyof T]: AppEvent<T[K]> };
