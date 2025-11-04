import type { Event, EventEmitter, Task } from "@types";
import { MAX_TASKS_PER_DAY } from "@constants";

import { calculateGapsInWorkingDay } from "./calculate-gaps-in-working-day.ts";
import { IntervalAllocator } from "./interval-allocator.ts";

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
  eventEmitter: EventEmitter,
): DayOutcome => {
  eventEmitter.emit("BeginGeneratingDayMoveEvents", { offset: dayOffset });
  if (dayTasks.length === MAX_TASKS_PER_DAY) {
    eventEmitter.emit("DayTasksIsAtMax", { offset: dayOffset });
    return { status: "MaxTasks" };
  }

  if (dayTasks.length > MAX_TASKS_PER_DAY) {
    const [, , ...rest] = dayTasks;
    eventEmitter.emit("TooManyTasksInDay", { offset: dayOffset, toMove: rest });
    return { status: "GreaterThanMaxTasks", toMove: rest };
  }

  const gaps = calculateGapsInWorkingDay(eventsOnDay, dayTasks, dayOffset);
  eventEmitter.emit("CalculatingWorkingDayGaps", gaps);
  const allocator = new IntervalAllocator(gaps, eventEmitter);

  const remainingCapacity = Math.max(0, MAX_TASKS_PER_DAY - dayTasks.length);

  for (
    let taskToAllocate = 0;
    taskToAllocate < tasksToMove.length &&
    allocator.allocatedTasks.length < remainingCapacity;

  ) {
    const theTask = tasksToMove[taskToAllocate];

    if (!theTask) {
      taskToAllocate++;
      continue;
    }

    if (!allocator.tryAllocate(theTask)) {
      break;
    }

    tasksToMove.splice(taskToAllocate, 1);
  }

  eventEmitter.emit("NewTasksAllocated", {
    offset: dayOffset,
    updateTasks: allocator.allocatedTasks,
  });

  return {
    status: "LessThanMaxTasks",
    newTasks: allocator.allocatedTasks,
  };
};
