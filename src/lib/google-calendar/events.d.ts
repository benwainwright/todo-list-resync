import type { Event } from "@types";

declare global {
  interface Events {
    GoogleCalendarClientInitialised: undefined;
    GoogleCalendarEventsRequesting: undefined;
    GoogleCalenderEventsRecieved: Event[];
  }
}

export {};
