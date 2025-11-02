import {
  TodoistApi,
  type Task as TodoistTask,
} from "@doist/todoist-api-typescript";

import type { Task, TasksApi } from "@types";

export class TodoistClient implements TasksApi {
  private api: TodoistApi;

  public constructor(config: { token: string }) {
    this.api = new TodoistApi(config.token);
  }

  async updateTask(task: Task): Promise<void> {
    const start = task.start?.date.toISOString() ?? "";
    await this.api.updateTask(task.id, {
      dueDatetime: start,
      duration: task.duration?.amount ?? 0,
      durationUnit: task.duration?.unit ?? "minute",
    });
  }

  public async getTasks(): Promise<Task[]> {
    console.log("Downloading tasks from todoist");
    const tasks = await this.getTasksHelper();
    console.log("Finished downloading tasks from todoist");
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
