import { type Event } from "./event.ts";

export interface CalendarApi {
  getEvents: () => Promise<Event[]>;
}
