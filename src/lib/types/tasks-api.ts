import type { Task } from "./task.ts";

export interface TasksApi {
  getTasks: () => Promise<Task[]>;
  updateTask: (task: Task) => Promise<void>;
}
