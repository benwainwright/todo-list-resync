import { expect, test } from "bun:test";
import { DateTime } from "luxon";

import { findOccupiedIntervals } from "./find-occupied-intervals.ts";
import type { Event, Task } from "@types";

test("merges overlapping occupied intervals from events and tasks", () => {
  const base = DateTime.fromISO("2024-01-01T09:00:00.000Z");

  const events: Event[] = [
    {
      id: "event-1",
      start: base.toJSDate(),
      end: base.plus({ hours: 1 }).toJSDate(),
    },
    {
      id: "event-2",
      start: base.plus({ hours: 3 }).toJSDate(),
      end: base.plus({ hours: 4 }).toJSDate(),
    },
  ];

  const tasks: Task[] = [
    {
      id: "task-1",
      start: { date: base.plus({ minutes: 30 }).toJSDate() },
      duration: { amount: 60, unit: "minute" },
      title: "Task overlapping first event",
      description: "",
    },
    {
      id: "task-2",
      start: { date: base.plus({ hours: 3, minutes: 45 }).toJSDate() },
      duration: { amount: 30, unit: "minute" },
      title: "Task overlapping second event",
      description: "",
    },
  ];

  const intervals = findOccupiedIntervals(events, tasks);

  expect(intervals).toHaveLength(2);
  expect(intervals[0].start.toISO()).toBe(base.toISO());
  expect(intervals[0].end.toISO()).toBe(
    base.plus({ hours: 1, minutes: 30 }).toISO(),
  );
  expect(intervals[1].start.toISO()).toBe(base.plus({ hours: 3 }).toISO());
  expect(intervals[1].end.toISO()).toBe(
    base.plus({ hours: 4, minutes: 15 }).toISO(),
  );
});

test("ignores events and tasks without a valid interval", () => {
  const base = DateTime.fromISO("2024-01-02T09:00:00.000Z");

  const events: Event[] = [
    {
      id: "valid-event",
      start: base.toJSDate(),
      end: base.plus({ hours: 1 }).toJSDate(),
    },
    {
      id: "missing-end",
      start: base.plus({ hours: 2 }).toJSDate(),
    },
    {
      id: "missing-start",
      end: base.plus({ hours: 3 }).toJSDate(),
    },
  ];

  const tasks: Task[] = [
    {
      id: "valid-task",
      start: { date: base.plus({ hours: 2 }).toJSDate() },
      duration: { amount: 1, unit: "day" },
      title: "Valid task",
      description: "",
    },
    {
      id: "missing-start",
      duration: { amount: 30, unit: "minute" },
      title: "No start",
      description: "",
    },
    {
      id: "missing-duration",
      start: { date: base.plus({ hours: 4 }).toJSDate() },
      title: "No duration",
      description: "",
    },
  ];

  const intervals = findOccupiedIntervals(events, tasks);

  expect(intervals).toHaveLength(2);
  expect(intervals[0].start.toISO()).toBe(base.toISO());
  expect(intervals[0].end.toISO()).toBe(base.plus({ hours: 1 }).toISO());
  expect(intervals[1].start.toISO()).toBe(base.plus({ hours: 2 }).toISO());
  expect(intervals[1].end.toISO()).toBe(base.plus({ hours: 26 }).toISO());
});
