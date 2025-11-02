import type { Task } from "@types";
import { DateTime, Interval } from "luxon";

export const intervalFromTask = (task: Task) => {
  if (!task.start || !task.duration) {
    return undefined;
  }
  const start = DateTime.fromJSDate(task.start.date);
  const units = task.duration?.unit === "minute" ? "minutes" : "days";
  const end = DateTime.fromMillis(start.toMillis()).plus({
    [units]: task.duration?.amount,
  });

  return Interval.fromDateTimes(start, end);
};
