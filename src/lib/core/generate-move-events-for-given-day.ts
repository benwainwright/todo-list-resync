import type { Event, Task } from "@types";
import { MAX_TASKS_PER_DAY } from "@constants";
import { calculateGapsInWorkingDay } from "./calculate-gaps-in-working-day.ts";
import { IntervalAllocator } from "./interval-allocator.ts";
import type { TaskUpdateEvent } from "lib/types/task-update-event.ts";

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
  tasksToMove: Task[],
  dayOffset: number,
): DayOutcome => {
  if (dayTasks.length === MAX_TASKS_PER_DAY) {
    return { status: "MaxTasks" };
  }

  if (dayTasks.length > MAX_TASKS_PER_DAY) {
    const [, , ...rest] = dayTasks;
    return { status: "GreaterThanMaxTasks", toMove: rest };
  }

  const gaps = calculateGapsInWorkingDay(eventsOnDay, dayTasks, dayOffset);

  const allocator = new IntervalAllocator(gaps);

  let allocations = 0;

  for (
    let taskToAllocate = 0;
    allocations < MAX_TASKS_PER_DAY &&
    taskToAllocate < tasksToMove.length - allocations;
    taskToAllocate++
  ) {
    const theTask = tasksToMove[taskToAllocate];
    if (theTask && allocator.tryAllocate(theTask)) {
      tasksToMove.splice(taskToAllocate, 1);
      allocations++;
    }
  }

  return {
    status: "LessThanMaxTasks",
    newTasks: allocator.allocatedIntervals.map((interval) => interval.task),
  };
};
