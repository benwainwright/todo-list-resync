import { Interval } from "luxon";
import { getEndOfDayN } from "./get-end-of-day-n.ts";
import { getStartOfDayN } from "./get-start-of-day-n.ts";

export const generateWorkingDayInterval = (
  offset: number,
  startHour: number,
  endHour: number,
) => {
  const dayStart = getStartOfDayN(offset).set({ hour: startHour });
  const dayEnd = getEndOfDayN(offset).set({ hour: endHour });

  return Interval.fromDateTimes(dayStart, dayEnd);
};
