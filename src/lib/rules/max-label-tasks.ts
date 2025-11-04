import type { Rule, Task } from "@types";

export class MaxLabelTasks implements Rule {
  public constructor(
    private max: number,
    private label: string,
  ) {}

  public collectInvalid(dayTasks: Task[]) {
    const labelTasks = dayTasks.filter((item) =>
      item.labels.includes(this.label),
    );

    return labelTasks.slice(this.max);
  }

  public validateAllocation(dayTasks: Task[], task: Task): boolean {
    const labelTasks = dayTasks.filter((item) =>
      item.labels.includes(this.label),
    );

    return (
      !task.labels.includes(this.label) || labelTasks.length + 1 <= this.max
    );
  }
}
