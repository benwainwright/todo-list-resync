import type { Event, Task } from "@types";
import { intervalFromTask } from "./interval-from-task.ts";
import { intervalFromEvent } from "./interval-from-event.ts";
import { Interval } from "luxon";

export const findOccupiedIntervals = (
  events: Event[],
  tasks: Task[],
  offset: number,
) => {
  console.log;
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
