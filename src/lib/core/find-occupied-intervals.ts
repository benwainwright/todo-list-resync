import { Interval } from "luxon";
import type { Event, Task } from "@types";
import { intervalFromTask } from "./interval-from-task.ts";
import { intervalFromEvent } from "./interval-from-event.ts";

export const findOccupiedIntervals = (
  events: Event[],
  tasks: Task[],
) => {
  const intervals = [...events, ...tasks].flatMap((thing) => {
    const interval =
      "duration" in thing
        ? intervalFromTask(thing)
        : "end" in thing
          ? intervalFromEvent(thing)
          : undefined;
    return interval ? [interval] : [];
  });

  return Interval.merge(intervals);
};
