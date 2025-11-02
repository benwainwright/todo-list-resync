import {
  TodoistApi,
  type Task as TodoistTask,
} from "@doist/todoist-api-typescript";

import type { EventEmitter, Task, TasksApi } from "@types";

export class TodoistClient implements TasksApi {
  private api: TodoistApi;
  private events: EventEmitter;

  public constructor(config: { token: string; events: EventEmitter }) {
    this.api = new TodoistApi(config.token);
    this.events = config.events;
    this.events.emit("TodoistClientInitialised");
  }

  async updateTask(task: Task): Promise<void> {
    this.events.emit("TodoistTaskUpdateStarted", task);
    const start = task.start?.date.toISOString() ?? "";
    await this.api.updateTask(task.id, {
      dueDatetime: start,
      duration: task.duration?.amount ?? 0,
      durationUnit: task.duration?.unit ?? "minute",
    });
    this.events.emit("TodoistTaskUpdated", task);
  }

  public async getTasks(): Promise<Task[]> {
    this.events.emit("TodoistTasksRequesting");
    const tasks = await this.getTasksHelper();
    this.events.emit("TodoistTasksRequested");
    return tasks;
  }

  private async getTasksHelper(previousCursor?: string): Promise<Task[]> {
    const { nextCursor, results: tasks } = await this.api.getTasks({
      cursor: previousCursor,
    });

    if (!nextCursor) {
      return this.normaliseTodoistTask(tasks);
    }

    return [
      ...this.normaliseTodoistTask(tasks),
      ...(await this.getTasksHelper(nextCursor)),
    ];
  }

  private normaliseTodoistTask(tasks: TodoistTask[]): Task[] {
    return tasks.map((task) => ({
      id: task.id,
      description: task.description,
      title: task.content,
      start: {
        date: new Date(task.due?.date ?? ""),
        timezone: task.due?.timezone === null ? undefined : task.due?.timezone,
      },
      duration: task.duration === null ? undefined : task.duration,
    }));
  }
}
