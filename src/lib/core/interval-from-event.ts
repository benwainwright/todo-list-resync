import type { Event } from "@types";
import { DateTime, Interval } from "luxon";

export const intervalFromEvent = (event: Event) => {
  if (!event.start || !event.end) {
    return undefined;
  }

  return Interval.fromDateTimes(
    DateTime.fromJSDate(event.start),
    DateTime.fromJSDate(event.end),
  );
};
