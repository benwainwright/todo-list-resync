import { Interval } from "luxon";

import { getStartOfDayN } from "./get-start-of-day-n.ts";

export const generateWorkingDayInterval = (
  offset: number,
  startHour: number,
  endHour: number,
) => {
  const baseDay = getStartOfDayN(offset);
  const dayStart = baseDay.set({
    hour: startHour,
    minute: 0,
    second: 0,
    millisecond: 0,
  });
  const dayEnd = baseDay.set({
    hour: endHour,
    minute: 0,
    second: 0,
    millisecond: 0,
  });

  return Interval.fromDateTimes(dayStart, dayEnd);
};
