import type { Task } from "@types";
import { Interval } from "luxon";
import { intervalFromTask } from "./interval-from-task.ts";
import { DEFAULT_TASK_MINUTES } from "@constants";

export class IntervalAllocator {
  public constructor(private _gaps: Interval[]) {}

  public readonly allocatedIntervals: { task: Task; newInterval: Interval }[] =
    [];

  public get gaps(): Interval[] {
    return this._gaps.flatMap((gap) =>
      Interval.xor([
        gap,
        ...this.allocatedIntervals.map(
          (allocatedInterval) => allocatedInterval.newInterval,
        ),
      ]),
    );
  }

  public tryAllocate(task: Task) {
    for (const gap of this.gaps) {
      if (task && gap.start) {
        const newTask = {
          ...task,
          start: { date: gap.start?.toJSDate() },
          duration: task.duration ?? {
            unit: "minute",
            amount: DEFAULT_TASK_MINUTES,
          },
        };
        const candidateInterval = intervalFromTask(newTask);

        if (candidateInterval && gap.engulfs(candidateInterval)) {
          this.allocatedIntervals.push({
            task: newTask,
            newInterval: candidateInterval,
          });
        }
        return true;
      }
    }
    return false;
  }
}
