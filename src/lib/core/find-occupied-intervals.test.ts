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
  const first = intervals[0];
  if (!first) {
    throw new Error("Expected first interval to exist");
  }
  const second = intervals[1];
  if (!second) {
    throw new Error("Expected second interval to exist");
  }
  const firstStartIso = first.start?.toISO() ?? null;
  const firstEndIso = first.end?.toISO() ?? null;
  const expectedFirstStartIso = base.toISO();
  const expectedFirstEndIso = base.plus({ hours: 1, minutes: 30 }).toISO();
  if (
    firstStartIso === null ||
    firstEndIso === null ||
    expectedFirstStartIso === null ||
    expectedFirstEndIso === null
  ) {
    throw new Error("Expected ISO strings for first interval comparisons");
  }
  expect(firstStartIso).toBe(expectedFirstStartIso);
  expect(firstEndIso).toBe(expectedFirstEndIso);

  const secondStartIso = second.start?.toISO() ?? null;
  const secondEndIso = second.end?.toISO() ?? null;
  const expectedSecondStartIso = base.plus({ hours: 3 }).toISO();
  const expectedSecondEndIso = base.plus({ hours: 4, minutes: 15 }).toISO();
  if (
    secondStartIso === null ||
    secondEndIso === null ||
    expectedSecondStartIso === null ||
    expectedSecondEndIso === null
  ) {
    throw new Error("Expected ISO strings for second interval comparisons");
  }
  expect(secondStartIso).toBe(expectedSecondStartIso);
  expect(secondEndIso).toBe(expectedSecondEndIso);
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
  const firstValid = intervals[0];
  if (!firstValid) {
    throw new Error("Expected first valid interval to exist");
  }
  const secondValid = intervals[1];
  if (!secondValid) {
    throw new Error("Expected second valid interval to exist");
  }
  const firstValidStartIso = firstValid.start?.toISO() ?? null;
  const firstValidEndIso = firstValid.end?.toISO() ?? null;
  const expectedFirstValidStartIso = base.toISO();
  const expectedFirstValidEndIso = base.plus({ hours: 1 }).toISO();
  if (
    firstValidStartIso === null ||
    firstValidEndIso === null ||
    expectedFirstValidStartIso === null ||
    expectedFirstValidEndIso === null
  ) {
    throw new Error("Expected ISO strings for valid first interval");
  }
  expect(firstValidStartIso).toBe(expectedFirstValidStartIso);
  expect(firstValidEndIso).toBe(expectedFirstValidEndIso);

  const secondValidStartIso = secondValid.start?.toISO() ?? null;
  const secondValidEndIso = secondValid.end?.toISO() ?? null;
  const expectedSecondValidStartIso = base.plus({ hours: 2 }).toISO();
  const expectedSecondValidEndIso = base.plus({ hours: 26 }).toISO();
  if (
    secondValidStartIso === null ||
    secondValidEndIso === null ||
    expectedSecondValidStartIso === null ||
    expectedSecondValidEndIso === null
  ) {
    throw new Error("Expected ISO strings for valid second interval");
  }
  expect(secondValidStartIso).toBe(expectedSecondValidStartIso);
  expect(secondValidEndIso).toBe(expectedSecondValidEndIso);
});
