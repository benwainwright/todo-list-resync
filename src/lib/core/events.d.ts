import type { Task } from "@types";
import type { Interval } from "luxon";

declare global {
  interface Events {
    SyncFinished: undefined;
    SyncStarted: undefined;
    SyncError: Error;
    IdentifiedInitialTasksToMove: Task[];
    StartingDay: { offset: number };
    BeginGeneratingDayMoveEvents: { offset: number };
    DayTasksIsAtMax: { offset: number };
    TooManyTasksInDay: { offset: number; toMove: Task[] };
    NewTasksAllocated: { offset: number; updateTasks: Task[] };
    CalculatingWorkingDayGaps: Interval[];
    FinishedCalculation: { tasksToUpdate: Task[] };
    RulesFailed: { rules: Rule; tasks: Task[]; task: Task };
    TryAllocation: { task: Task; gaps: Interval[] };
    TryGap: Interval;
    AllocationSucceed: {
      old: Task;
      new: Task;
    };
    AllocationFailed: undefined;
  }
}
