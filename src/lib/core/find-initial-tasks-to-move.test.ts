import { expect, test } from "bun:test";
import { DateTime, Settings } from "luxon";

import type { Task } from "@types";
import { findInitialTasksToMove } from "./find-initial-tasks-to-move.ts";

const fixedNow = DateTime.fromISO("2024-01-15T12:00:00");

const makeTask = (
  partial: Partial<Task> & Pick<Task, "id" | "title" | "description">,
): Task => ({
  duration: undefined,
  start: partial.start,
  id: partial.id,
  title: partial.title,
  description: partial.description,
});

test("returns tasks with no schedule", () => {
  Settings.now = () => fixedNow.toMillis();

  const tasks: Task[] = [
    makeTask({ id: "1", title: "A", description: "unscheduled" }),
    makeTask({
      id: "2",
      title: "B",
      description: "scheduled today",
      start: { date: fixedNow.plus({ hours: 1 }).toJSDate() },
    }),
  ];

  const result = findInitialTasksToMove(tasks);
  expect(result.map((t) => t.id)).toEqual(["1"]);

  Settings.now = () => Date.now();
});

test("returns overdue tasks (scheduled before start of today)", () => {
  Settings.now = () => fixedNow.toMillis();

  const tasks: Task[] = [
    makeTask({
      id: "1",
      title: "overdue yesterday",
      description: "overdue",
      start: { date: fixedNow.minus({ days: 1, hours: 1 }).toJSDate() },
    }),
    makeTask({
      id: "2",
      title: "today",
      description: "today",
      start: { date: fixedNow.plus({ hours: 2 }).toJSDate() },
    }),
  ];

  const result = findInitialTasksToMove(tasks);
  expect(result.map((t) => t.id)).toEqual(["1"]);

  Settings.now = () => Date.now();
});

test("does not include tasks at exactly start of today or later", () => {
  Settings.now = () => fixedNow.toMillis();

  const startOfToday = fixedNow.startOf("day");

  const tasks: Task[] = [
    makeTask({
      id: "1",
      title: "at start of today",
      description: "boundary",
      start: { date: startOfToday.toJSDate() },
    }),
    makeTask({
      id: "2",
      title: "later today",
      description: "in future today",
      start: { date: startOfToday.plus({ hours: 3 }).toJSDate() },
    }),
    makeTask({
      id: "3",
      title: "tomorrow",
      description: "in future",
      start: { date: startOfToday.plus({ days: 1 }).toJSDate() },
    }),
  ];

  const result = findInitialTasksToMove(tasks);
  expect(result).toHaveLength(0);

  Settings.now = () => Date.now();
});
