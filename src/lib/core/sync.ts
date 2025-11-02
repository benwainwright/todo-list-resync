import type { CalendarApi, TasksApi, Event, Task } from "@types";
import { findInitialTasksToMove } from "./find-initial-tasks-to-move.ts";
import { DateTime } from "luxon";
import { getEventsOnNowPlusIndex } from "./get-events-on-now-plus-index.ts";
import { generateMoveEventsForGivenDay } from "./generate-move-events-for-given-day.ts";
import { getTasksOnNowPlusIndex } from "./get-tasks-on-now-plus-index.ts";
import type { TaskUpdateEvent } from "lib/types/task-update-event.ts";

interface SyncConfig {
  calendar: CalendarApi;
  taskList: TasksApi;
}

export const runSync = async ({ calendar, taskList }: SyncConfig) => {
  const events = await calendar.getEvents();
  const tasks = await taskList.getTasks();

  const tasksToMove = findInitialTasksToMove(tasks);

  const tasksToUpdate: Task[] = [];

  for (let dayOffset = 0; tasksToMove.length > 0; dayOffset++) {
    const dayEvents = getEventsOnNowPlusIndex(events, dayOffset);
    const dayTasks = getTasksOnNowPlusIndex(tasks, dayOffset);

    const moveEvents = generateMoveEventsForGivenDay(
      dayEvents,
      dayTasks,
      tasksToMove,
      dayOffset,
    );

    switch (moveEvents.status) {
      case "GreaterThanMaxTasks":
        tasksToMove.push(...moveEvents.toMove);
        break;

      case "LessThanMaxTasks":
        tasksToUpdate.push(...moveEvents.newTasks);
    }
  }

  await Promise.all(
    tasksToUpdate.map(async (task) => await taskList.updateTask(task)),
  );
};
