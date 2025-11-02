import type { Task, Event } from "@types";
import { findOccupiedIntervals } from "./find-occupied-intervals.ts";
import { generateWorkingDayInterval } from "./generate-work-day-interval.ts";
import { WORKING_DAY_FINISH_HOUR, WORKING_DAY_START_HOUR } from "@constants";
import { Interval } from "luxon";

export const calculateGapsInWorkingDay = (
  eventsOnDay: Event[],
  tasksOnDay: Task[],
  dayOffset: number,
) => {
  const occupiedIntervals = findOccupiedIntervals(eventsOnDay, tasksOnDay);

  const workingDayInterval = generateWorkingDayInterval(
    dayOffset,
    WORKING_DAY_START_HOUR,
    WORKING_DAY_FINISH_HOUR,
  );

  const xor = Interval.xor([...occupiedIntervals, workingDayInterval]);

  return xor.filter((potentialCandidate) =>
    workingDayInterval.engulfs(potentialCandidate),
  );
};
