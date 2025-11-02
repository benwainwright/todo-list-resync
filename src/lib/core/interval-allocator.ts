import type { EventEmitter, Task } from "@types";
import { Interval } from "luxon";
import { intervalFromTask } from "./interval-from-task.ts";
import { DEFAULT_TASK_MINUTES } from "@constants";

export class IntervalAllocator {
  private _cachedGaps: Interval[] | null = null;

  public constructor(
    private _gaps: Interval[],
    private events: EventEmitter,
  ) {}

  public readonly allocatedIntervals: { task: Task; newInterval: Interval }[] =
    [];

  public get gaps(): Interval[] {
    if (!this._cachedGaps) {
      this._cachedGaps = this._gaps.flatMap((gap) =>
        Interval.xor([
          gap,
          ...this.allocatedIntervals.map(
            (allocatedInterval) => allocatedInterval.newInterval,
          ),
        ]),
      );
    }

    return this._cachedGaps;
  }

  private invalidateGapsCache() {
    this._cachedGaps = null;
  }

  public tryAllocate(task: Task) {
    this.events.emit("TryAllocation", task);

    const gaps = this.gaps;

    for (const gap of gaps) {
      if (!gap.start) {
        continue;
      }

      this.events.emit("TryGap", gap);

      const newTask = {
        ...task,
        start: { date: gap.start.toJSDate() },
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
        this.invalidateGapsCache();
        this.events.emit("AllocationSucceed", { old: task, new: newTask });
        return true;
      }
    }

    this.events.emit("AllocationFailed");
    return false;
  }
}
