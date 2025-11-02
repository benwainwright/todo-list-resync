import type { CalendarApi, TasksApi, Task } from "@types";

import { findInitialTasksToMove } from "./find-initial-tasks-to-move.ts";
import { getEventsOnNowPlusIndex } from "./get-events-on-now-plus-index.ts";
import { generateMoveEventsForGivenDay } from "./generate-move-events-for-given-day.ts";
import { getTasksOnNowPlusIndex } from "./get-tasks-on-now-plus-index.ts";

interface SyncConfig {
  calendar: CalendarApi;
  taskList: TasksApi;
}

export const runSync = async ({ calendar, taskList }: SyncConfig) => {
  const eventsPromise = calendar.getEvents();
  const tasksPromise = taskList.getTasks();

  const tasks = await tasksPromise;
  const tasksToMove = findInitialTasksToMove(tasks);

  const tasksToUpdate: Task[] = [];

  const events = await eventsPromise;
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

  console.log(`Updating ${tasksToUpdate.length} tasks`);
  await Promise.all(
    tasksToUpdate.map(async (task) => await taskList.updateTask(task)),
  );
  console.log(`Finished!`);
};
