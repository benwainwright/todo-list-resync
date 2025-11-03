import { expect, test } from "bun:test";
import { EventBus } from "./event-bus.ts";

test("An event emitted on the bus without data is recieved by the on handler", () => {
  const bus = new EventBus();

  let emitted = false;

  bus.on("SyncStarted", () => {
    emitted = true;
  });

  bus.emit("SyncStarted");

  expect(emitted).toBeTruthy();
});

test("An event emitted on the bus with data is recieved by the on handler", () => {
  expect.assertions(1);
  const bus = new EventBus();

  bus.on("BeginGeneratingDayMoveEvents", (data) => {
    expect(data).toEqual({ offset: 1 });
  });

  bus.emit("BeginGeneratingDayMoveEvents", { offset: 1 });
});

test("An event emitted on the bus with data is received by the onAll handler", () => {
  expect.assertions(1);
  const bus = new EventBus();

  bus.onAll((data) => {
    expect(data).toEqual({
      name: "BeginGeneratingDayMoveEvents",
      data: { offset: 1 },
    });
  });

  bus.emit("BeginGeneratingDayMoveEvents", { offset: 1 });
});
