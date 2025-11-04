import type { Task } from "@types";
import type { TaskAllocator } from "./task-allocator/task-allocator";

export const moveTasksToDay = (
  dayAllocator: TaskAllocator,
  remainingTasks: Task[],
) => {
  for (let taskIndex = 0; taskIndex < remainingTasks.length; taskIndex++) {
    const theTask = remainingTasks[taskIndex];

    if (!theTask) {
      continue;
    }

    if (dayAllocator.tryAllocate(theTask)) {
      remainingTasks.splice(taskIndex, 1);
      taskIndex--;
    }
  }
};
