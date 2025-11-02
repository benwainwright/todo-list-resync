import { DateTime } from "luxon";
import type { Task } from "@types";
import { getStartOfDayN } from "./get-start-of-day-n";
import { getEndOfDayN } from "./get-end-of-day-n";

export const getTasksOnNowPlusIndex = (tasks: Task[], index: number) => {
  const dayStart = getStartOfDayN(index);
  const dayEnd = getEndOfDayN(index);

  return tasks.filter((task) => {
    if (task.description.includes("guitar")) {
      console.log(task);
    }
    const start = task.start && DateTime.fromJSDate(task.start.date);

    if (!start) {
      return false;
    }

    return start > dayStart && start < dayEnd;
  });
};
