import { DateTime } from "luxon";
import type { Event } from "@types";

import { getStartOfDayN } from "./get-start-of-day-n";
import { getEndOfDayN } from "./get-end-of-day-n";

export const getEventsOnNowPlusIndex = (events: Event[], index: number) => {
  const dayStart = getStartOfDayN(index);
  const dayEnd = getEndOfDayN(index);

  return events.filter((event) => {
    const start = event.start && DateTime.fromJSDate(event.start);

    if (!start) {
      return false;
    }

    return start > dayStart && start < dayEnd;
  });
};
