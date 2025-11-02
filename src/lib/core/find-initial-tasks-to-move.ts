import { DateTime } from "luxon";

import type { Task } from "@types";

export const findInitialTasksToMove = (tasks: Task[]) => {
  const hasNoSchedule = tasks.filter((item) => !item.start);

  const startOfToday = DateTime.now().startOf("day");

  const overdue = tasks.filter(
    (item) =>
      item.start?.date && DateTime.fromJSDate(item.start?.date) < startOfToday,
  );

  return [...hasNoSchedule, ...overdue];
};
