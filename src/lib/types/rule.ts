import type { Task } from "./task.ts";

export interface Rule {
  collectInvalid(dayTasks: Task[]): Task[];
  validateAllocation(dayTasks: Task[], task: Task): boolean;
}
