import type { Task } from "@types";

declare global {
  interface Events {
    TodoistClientInitialised: undefined;
    TodoistTaskUpdateStarted: Task;
    TodoistTaskUpdated: Task;
    TodoistTasksRequesting: undefined;
    TodoistTasksRecieved: Task[];
  }
}
