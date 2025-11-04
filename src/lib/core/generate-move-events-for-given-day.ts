import type { Event, EventEmitter, Rule, Task } from "@types";

import { calculateGapsInWorkingDay } from "./calculate-gaps-in-working-day.ts";
import { TaskAllocator } from "./task-allocator/index.ts";
import { moveTasksToDay } from "./move-tasks-to-day.ts";

interface MaxTasksOutcome {
  status: "MaxTasks";
}

interface GreaterThanMaxTasksOutcome {
  status: "GreaterThanMaxTasks";
  toMove: Task[];
}

interface LessThanMaxTasksOutcome {
  status: "LessThanMaxTasks";
  newTasks: Task[];
}

type DayOutcome =
  | LessThanMaxTasksOutcome
  | GreaterThanMaxTasksOutcome
  | MaxTasksOutcome;

export const generateMoveEventsForGivenDay = (
  eventsOnDay: Event[],
  dayTasks: Task[],
  remainingTasks: Task[],
  rules: Rule[],
  dayOffset: number,
  eventEmitter: EventEmitter,
): DayOutcome => {
  eventEmitter.emit("BeginGeneratingDayMoveEvents", { offset: dayOffset });

  const gaps = calculateGapsInWorkingDay(eventsOnDay, dayTasks, dayOffset);
  eventEmitter.emit("CalculatingWorkingDayGaps", gaps);

  const allocator = new TaskAllocator(gaps, eventEmitter, dayTasks, rules);

  moveTasksToDay(allocator, remainingTasks);

  return {
    status: "LessThanMaxTasks",
    newTasks: allocator.allocatedTasks,
  };
};
