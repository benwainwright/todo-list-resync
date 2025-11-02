import { Interval } from "luxon";
import type { Event, Task } from "@types";
import { intervalFromTask } from "./interval-from-task.ts";
import { intervalFromEvent } from "./interval-from-event.ts";

export const findOccupiedIntervals = (
  events: Event[],
  tasks: Task[],
  offset: number,
) => {
  const intervals = [...events, ...tasks].flatMap((thing) => {
    const interval =
      "duration" in thing
        ? intervalFromTask(thing)
        : "end" in thing
          ? intervalFromEvent(thing)
          : undefined;
    if (offset === 1) {
      console.log(interval);
    }
    return interval ? [interval] : [];
  });

  return Interval.merge(intervals);
};
