import type { EventEmitter, Rule, Task } from "@types";
import { Interval } from "luxon";
import { intervalFromTask } from "../interval-from-task.ts";
import { DEFAULT_TASK_MINUTES } from "@constants";

type EventEmitter = Partial<{
  [K in keyof Events as Uncapitalize<K>]: Events[K] extends never
    ? () => unknown
    : (args: Events[K]) => unknown;
}>;

const eventEmit = <TClass extends EventEmitter>(
  target: TClass,
  propertyKey: keyof Events,
  descriptor: PropertyDescriptor,
) => {
  const prop = target[propertyKey];
  if (typeof prop === "function") {
    const func: typeof prop = (...args: unknown[]): unknown => {
      const foo = args[0];
      if (typeof target[propertyKey] === "function") {
        return target[propertyKey]?.(foo);
      }
    };
  }
};

export class TaskAllocator implements EventEmitter {
  private _cachedGaps: Interval[] | null = null;
  private _rules: Rule[];

  public constructor(
    private _gaps: Interval[],
    private events: EventEmitter,
    private existingTasks: Task[],
    rules?: Rule[],
  ) {
    this._rules = rules ?? [];
  }

  public readonly allocatedTasks: Task[] = [];

  private get gaps(): Interval[] {
    if (!this._cachedGaps) {
      this._cachedGaps = this._gaps.flatMap((gap) =>
        Interval.xor([
          gap,
          ...this.allocatedTasks
            .map((task) => intervalFromTask(task))
            .flatMap((interval) => (interval ? [interval] : [])),
        ]),
      );
    }

    return this._cachedGaps;
  }

  private invalidateGapsCache() {
    this._cachedGaps = null;
  }

  @eventEmit
  public tryAllocate(task: Task) {
    const gaps = this.gaps;

    const dayTasks = [...this.existingTasks, ...this.allocatedTasks];

    const rulesFailed = this._rules.filter(
      (item) => !item.validateAllocation(dayTasks, task),
    );

    if (rulesFailed.length > 0) {
      this.events.emit("RulesFailed", {
        rules: rulesFailed,
        tasks: dayTasks,
        task,
      });
      return false;
    }

    this.events.emit("TryAllocation", { task, gaps });

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
        this.allocatedTasks.push(newTask);
        this.invalidateGapsCache();
        this.events.emit("AllocationSucceed", { old: task, new: newTask });
        return true;
      }
    }

    this.events.emit("AllocationFailed");
    return false;
  }
}
