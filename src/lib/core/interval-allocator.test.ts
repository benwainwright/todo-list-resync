import { describe, expect, test } from "bun:test";
import { DateTime, Interval } from "luxon";

import { IntervalAllocator } from "./interval-allocator.ts";
import { DEFAULT_TASK_MINUTES } from "@constants";
import type { EventEmitter, Task } from "@types";

type EmittedEvent = {
  name: keyof Events;
  data: Events[keyof Events] | undefined;
};

const createMockEmitter = () => {
  const emitted: EmittedEvent[] = [];

  const emitter: EventEmitter = {
    emit(name, data) {
      emitted.push({ name, data });
    },
    on() {
      // no-op for tests
    },
  };

  return { emitter, emitted };
};

describe("IntervalAllocator", () => {
  test("allocates a task into the first fitting gap and updates gaps", () => {
    const base = DateTime.fromISO("2024-01-01T09:00:00.000Z");
    const gap = Interval.fromDateTimes(base, base.plus({ hours: 2 }));
    const { emitter, emitted } = createMockEmitter();
    const allocator = new IntervalAllocator([gap], emitter);

    const initialGaps = allocator.gaps;

    expect(initialGaps).toHaveLength(1);
    expect(initialGaps[0].equals(gap)).toBe(true);

    const task: Task = {
      id: "task-1",
      title: "Task without scheduling info",
      description: "",
    };

    const success = allocator.tryAllocate(task);

    expect(success).toBe(true);
    expect(allocator.allocatedIntervals).toHaveLength(1);

    const [allocated] = allocator.allocatedIntervals;
    expect(DateTime.fromJSDate(allocated.task.start!.date).toISO()).toBe(
      base.toISO(),
    );
    expect(allocated.task.duration).toEqual({
      unit: "minute",
      amount: DEFAULT_TASK_MINUTES,
    });
    expect(allocated.newInterval.start.toISO()).toBe(base.toISO());
    expect(allocated.newInterval.end.toISO()).toBe(
      base.plus({ minutes: DEFAULT_TASK_MINUTES }).toISO(),
    );

    const updatedGaps = allocator.gaps;

    expect(updatedGaps).toHaveLength(1);
    expect(updatedGaps[0].start.toISO()).toBe(
      base.plus({ minutes: DEFAULT_TASK_MINUTES }).toISO(),
    );
    expect(updatedGaps[0].end.toISO()).toBe(gap.end?.toISO());

    expect(emitted.map((event) => event.name)).toEqual([
      "TryAllocation",
      "TryGap",
      "AllocationSucceed",
    ]);

    const tryAllocationEvent = emitted[0];
    expect(tryAllocationEvent.data).toEqual({ task, gaps: initialGaps });

    const allocationSucceedEvent = emitted[2];
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
