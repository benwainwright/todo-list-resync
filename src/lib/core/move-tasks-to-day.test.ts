import { spyOn, test, expect } from "bun:test";
import { moveTasksToDay } from "./move-tasks-to-day.ts";
import type { Task } from "@types";
import { mock } from "bun-mock-extended";
import { TaskAllocator } from "./task-allocator/index.ts";

const makeTask = (
  partial: Partial<Task> & Pick<Task, "id" | "title" | "description">,
): Task => ({
  duration: undefined,
  labels: ["string"],
  start: partial.start,
  id: partial.id,
  title: partial.title,
  description: partial.description,
});

test("When tryAllocate always returns true, the input remains untouched", () => {
  const taskOne = makeTask({ id: "id", title: "task", description: "foo" });
  const taskTwo = makeTask({ id: "id-1", title: "task", description: "foo" });
  const taskThree = makeTask({ id: "id-2", title: "task", description: "foo" });

  const allocator = new TaskAllocator([], mock(), []);

  spyOn(allocator, "tryAllocate").mockReturnValue(false);

  const originalTasks = [taskOne, taskTwo, taskThree];

  moveTasksToDay(allocator, originalTasks);

  expect(originalTasks).toHaveLength(3);
});

test("When tryAllocate returns true, it results in the item being removed from the list", () => {
  const taskOne = makeTask({ id: "id", title: "task", description: "foo" });
  const taskTwo = makeTask({ id: "id-1", title: "task", description: "foo" });
  const taskThree = makeTask({ id: "id-2", title: "task", description: "foo" });

  const allocator = new TaskAllocator([], mock(), []);

  spyOn(allocator, "tryAllocate")
    .mockReturnValueOnce(false)
    .mockReturnValueOnce(true)
    .mockReturnValueOnce(false);

  const originalTasks = [taskOne, taskTwo, taskThree];

  moveTasksToDay(allocator, originalTasks);

  expect(originalTasks).toHaveLength(2);
  expect(originalTasks[0]).toEqual(taskOne);
  expect(originalTasks[1]).toEqual(taskThree);
});

test("When multiple allocations suceed, they all get removed from the list", () => {
  const taskOne = makeTask({ id: "id", title: "task", description: "foo" });
  const taskTwo = makeTask({ id: "id-1", title: "task", description: "foo" });
  const taskThree = makeTask({ id: "id-2", title: "task", description: "foo" });

  const allocator = new TaskAllocator([], mock(), []);

  spyOn(allocator, "tryAllocate")
    .mockReturnValueOnce(true)
    .mockReturnValueOnce(true)
    .mockReturnValueOnce(false);

  const originalTasks = [taskOne, taskTwo, taskThree];

  moveTasksToDay(allocator, originalTasks);

  expect(originalTasks).toHaveLength(1);
  expect(originalTasks[0]).toEqual(taskThree);
});
