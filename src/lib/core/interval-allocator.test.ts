import { describe, expect, test } from "bun:test";
import { DateTime, Interval } from "luxon";

import { IntervalAllocator } from "./interval-allocator.ts";
import { DEFAULT_TASK_MINUTES } from "@constants";
import type { EventEmitter, Task } from "@types";

type EmittedEvent<TName extends keyof Events = keyof Events> = {
  name: TName;
  data: Events[TName] | undefined;
};

const createMockEmitter = () => {
  const emitted: EmittedEvent[] = [];

  const emitter: EventEmitter = {
    emit<TEventName extends keyof Events>(
      name: TEventName,
      ...args: Events[TEventName] extends undefined ? [] : [Events[TEventName]]
    ) {
      const [data] = args;
      emitted.push({ name, data });
    },
    on<TEventName extends keyof Events>(
      _name: TEventName,
      _callback: (data: Events[TEventName]) => void,
    ) {
      void _name;
      void _callback;
    },
  };

  return { emitter, emitted };
};

describe("IntervalAllocator", () => {
  const base = DateTime.fromISO("2024-01-01T09:00:00.000Z");
  const gap = Interval.fromDateTimes(base, base.plus({ hours: 2 }));

  const createAllocator = () => {
    const { emitter, emitted } = createMockEmitter();
    const allocator = new IntervalAllocator([gap], emitter);
    return { allocator, emitted };
  };

  const createTask = (): Task => ({
    id: "task-1",
    title: "Task without scheduling info",
    labels: [],
    description: "",
  });

  test("returns true and records allocation when a gap can fit", () => {
    const { allocator } = createAllocator();
    const task = createTask();

    const success = allocator.tryAllocate(task);

    expect(success).toBe(true);
    expect(allocator.allocatedIntervals).toHaveLength(1);

    const allocated = allocator.allocatedIntervals[0];
    if (!allocated) {
      throw new Error("Expected an allocated interval to exist");
    }
    if (!allocated.task.start) {
      throw new Error("Expected allocated task to have start defined");
    }
    const allocatedStartIso = DateTime.fromJSDate(
      allocated.task.start.date,
    ).toISO();
    const baseIso = base.toISO();
    expect(allocatedStartIso).not.toBeNull();
    expect(baseIso).not.toBeNull();
    expect(allocatedStartIso).toBe(baseIso);
    expect(allocated.task.duration).toEqual({
      unit: "minute",
      amount: DEFAULT_TASK_MINUTES,
    });
    const newStartIso = allocated.newInterval.start?.toISO() ?? null;
    const newEndIso = allocated.newInterval.end?.toISO() ?? null;
    const expectedStartIso = base.toISO();
    const expectedEndIso = base.plus({ minutes: DEFAULT_TASK_MINUTES }).toISO();
    if (
      newStartIso === null ||
      newEndIso === null ||
      expectedStartIso === null ||
      expectedEndIso === null
    ) {
      throw new Error("Expected ISO strings for new interval bounds");
    }
    expect(newStartIso).toBe(expectedStartIso);
    expect(newEndIso).toBe(expectedEndIso);
  });

  test("recalculates gaps after a successful allocation", () => {
    const { allocator } = createAllocator();
    const task = createTask();

    const initialGaps = allocator.gaps;
    expect(initialGaps).toHaveLength(1);

    const success = allocator.tryAllocate(task);
    expect(success).toBe(true);

    const updatedGaps = allocator.gaps;
    expect(updatedGaps).toHaveLength(1);
    const [firstGap] = updatedGaps;
    if (!firstGap) {
      throw new Error("Expected at least one updated gap");
    }
    const expectedGapStartIso = base
      .plus({ minutes: DEFAULT_TASK_MINUTES })
      .toISO();
    const gapStartIso = firstGap.start?.toISO() ?? null;
    const gapEndIso = firstGap.end?.toISO() ?? null;
    const expectedGapEndIso = gap.end?.toISO() ?? null;
    if (
      gapStartIso === null ||
      gapEndIso === null ||
      expectedGapStartIso === null ||
      expectedGapEndIso === null
    ) {
      throw new Error("Expected ISO strings for updated gap bounds");
    }
    expect(gapStartIso).toBe(expectedGapStartIso);
    expect(gapEndIso).toBe(expectedGapEndIso);
  });

  test("emits detailed events for a successful allocation", () => {
    const { allocator, emitted } = createAllocator();
    const task = createTask();
    const initialGaps = allocator.gaps;

    const success = allocator.tryAllocate(task);
    expect(success).toBe(true);
    const allocated = allocator.allocatedIntervals[0];
    if (!allocated) {
      throw new Error("Expected an allocated interval after success");
    }

    expect(emitted.map((event) => event.name)).toEqual([
      "TryAllocation",
      "TryGap",
      "AllocationSucceed",
    ]);

    const tryAllocationEvent = emitted[0];
    if (!tryAllocationEvent) {
      throw new Error("Expected TryAllocation event to be emitted");
    }
    expect(tryAllocationEvent.data).toEqual({ task, gaps: initialGaps });

    const allocationSucceedEvent = emitted[2];
    if (!allocationSucceedEvent) {
      throw new Error("Expected AllocationSucceed event to be emitted");
    }
    expect(allocationSucceedEvent.data).toEqual({
      old: task,
      new: allocated.task,
    });
  });

  test("emits AllocationFailed when no gap can fit the task", () => {
    const base = DateTime.fromISO("2024-01-01T13:00:00.000Z");
    const gap = Interval.fromDateTimes(base, base.plus({ minutes: 30 }));
    const { emitter, emitted } = createMockEmitter();
    const allocator = new IntervalAllocator([gap], emitter);

    const task: Task = {
      id: "task-2",
      title: "Too long for the gap",
      description: "",
      labels: ["label"],
    };

    const success = allocator.tryAllocate(task);

    expect(success).toBe(false);
    expect(allocator.allocatedIntervals).toHaveLength(0);
    expect(emitted.map((event) => event.name)).toEqual([
      "TryAllocation",
      "TryGap",
      "AllocationFailed",
    ]);
  });
});
