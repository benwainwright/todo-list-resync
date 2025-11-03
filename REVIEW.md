# Project Review: todoist-resync

This document summarizes code, design, and tooling findings, with prioritized, actionable recommendations.

## Critical Issues

- Todoist pagination mismatch: `TodoistClient.getTasks` assumes `{ nextCursor, results }` from `getTasks()`, but `@doist/todoist-api-typescript` returns `TodoistTask[]` without pagination. Action: replace the cursor loop with a single call, or switch to a supported pagination method if the library exposes one.
- Invalid Date normalization (Todoist): `new Date(task.due?.date ?? "")` yields an Invalid Date when `due` is absent, causing unintended filtering in scheduling logic. Action: only construct `start` when a due date exists; otherwise leave `start` undefined.
- EventBus typing mismatch: `EventBus` methods are `async`, but the `EventEmitter` interface methods return `void`. In strict TS, this breaks interface conformance. Action: remove `async` from `emit`, `on`, and `onAll` (they are synchronous), or widen the interface to allow `void | Promise<void>`.
- Potential infinite loop in scheduler: `runSync` loops while `tasksToMove.length > 0` with no horizon. If tasks can never be allocated (e.g., duration > working day), the loop never terminates. Action: add a `MAX_DAYS_LOOKAHEAD` and bail out with an event when reached.

## Functional Improvements

- Safer Todoist normalization: Only include `start` when `task.due?.date` is present and valid; keep `timezone` undefined when not provided. This prevents Invalid Dates and lets `findInitialTasksToMove` work correctly.
- Todoist update mapping: Verify `updateTask` inputs. If using all-day dates, prefer `dueDate` over `dueDatetime`. Ensure nonzero durations are intentional (avoid writing `0` unless desired).
- Google Calendar client:
  - Auth: If encountering 401/403, pass API key via `key` on `events.list` calls instead of `auth` on the client, which is sometimes stricter.
  - Result window: Add `timeMax` (e.g., +30 days) to limit result size and improve performance.
- Scheduling horizon:
  - Add `MAX_DAYS_LOOKAHEAD` (e.g., 30) and emit `SchedulingHorizonReached` with remaining unallocated tasks.
  - Emit `UnallocatableTask` when a task cannot fit due to duration > working-day length.
- Events consistency: Fix typos in event names ("Recieved" → "Received"). Keep event payload types consistent and compact for `onAll` logging.

## Testing

Add focused unit tests around the core scheduling logic:

- `findInitialTasksToMove`: unscheduled vs overdue identification.
- `getEventsOnNowPlusIndex` / `getTasksOnNowPlusIndex`: day boundary correctness.
- `calculateGapsInWorkingDay`: gaps with overlapping events and tasks.
- `IntervalAllocator.tryAllocate`: success/failure paths, cache invalidation, and multiple allocations respecting capacity.
- Scheduler horizon: confirm bail-out after `MAX_DAYS_LOOKAHEAD` and emitted events.
- Clients: mock Google/Todoist responses; only core helpers should be pure logic tests.

## DX & Tooling

- lint-staged: Run ESLint in addition to Prettier.

  ```js
  // lint-staged.config.js
  export default {
    "*.{ts,js}": "bunx --bun eslint --fix",
    "*.{ts,js,json,md}": "bunx --bun prettier --write",
  };
  ```

- ESLint: current flat config is minimal. Consider enabling stricter TS rules when you add a project file:
  - `@typescript-eslint/no-floating-promises`
  - `@typescript-eslint/consistent-type-imports`
  - `eqeqeq`, `no-console` (optional, given CLI nature)

- Scripts & deps:
  - Move `typescript-eslint` to `devDependencies`.
  - Add `typescript` as a `devDependency` and a `typecheck` script.

  ```json
  {
    "scripts": {
      "typecheck": "tsc -p tsconfig.json --noEmit",
      "lint": "eslint .",
      "format": "prettier --write ."
    },
    "devDependencies": {
      "typescript": "^5.9.3",
      "typescript-eslint": "^8.46.2"
    }
  }
  ```

- CI: Add a simple GitHub Actions workflow to run `bun install`, `bun run lint`, `bun run typecheck`, and `bun test`.

## API/UX

- CLI configurability: Add flags for core constants so users don’t edit code for schedule changes.

  ```bash
  bun src/run.ts sync \
    --todoistToken "$TODOIST_TOKEN" \
    --googleApiKey "$GOOGLE_API_KEY" \
    --calendarId "$GOOGLE_CALENDAR_ID" \
    --startHour 9 --endHour 18 \
    --maxTasksPerDay 3 --defaultTaskMinutes 45
  ```

- Output quality: Replace raw `onAll` logging with a compact progress reporter summarizing counts, day offsets, and allocations; keep `onAll` available for debugging.

## Quick Wins

- Import extension consistency: Standardize local imports to include `.ts` for Bun ESM consistency.
- Remove or implement `src/lib/core/progress-client.ts` (currently empty).
- `package.json`: Remove the unused `"module": "index.ts"` (no root `index.ts`), or point it to the intended entry if publishing.

## Suggested Code Adjustments (Illustrative)

- EventBus: synchronous signatures to match the interface.

  ```ts
  // src/lib/core/event-bus.ts
  export class EventBus implements EventEmitter {
    private emitter = new NodeEventEmitter();

    emit<TEventName extends keyof globalThis.Events>(
      name: TEventName,
      ...args: globalThis.Events[TEventName] extends undefined
        ? []
        : [data: globalThis.Events[TEventName]]
    ): void {
      this.emitter.emit(EVENT_BUS_KEY, { name, data: args[0] });
    }

    onAll<TEventName extends keyof globalThis.Events = keyof globalThis.Events>(
      callback: (data: EmittedEvent<TEventName>) => void,
    ): void {
      this.emitter.on(EVENT_BUS_KEY, callback);
    }

    on<TEventName extends keyof globalThis.Events>(
      name: TEventName,
      callback: (data: globalThis.Events[TEventName]) => void,
    ): void {
      this.emitter.on(EVENT_BUS_KEY, (data: EmittedEvent<TEventName>) => {
        if (data.name === name) callback(data.data);
      });
    }
  }
  ```

- Todoist normalization: only set `start` when due date exists.

  ```ts
  // src/lib/todoist/todoist-client.ts
  private normaliseTodoistTask(tasks: TodoistTask[]): Task[] {
    return tasks.map((task) => {
      const dueDate = task.due?.date;
      const hasDue = typeof dueDate === "string" && dueDate.length > 0;
      return {
        id: task.id,
        description: task.description,
        title: task.content,
        start: hasDue ? { date: new Date(dueDate), timezone: task.due?.timezone ?? undefined } : undefined,
        duration: task.duration === null ? undefined : task.duration,
      };
    });
  }
  ```

- Scheduler horizon: bail out after N days.

  ```ts
  // src/lib/core/sync.ts
  const MAX_DAYS_LOOKAHEAD = 30;
  for (
    let dayOffset = 0;
    tasksToMove.length > 0 && dayOffset < MAX_DAYS_LOOKAHEAD;
    dayOffset++
  ) {
    // existing loop body
  }
  if (tasksToMove.length > 0) {
    eventEmitter.emit("SchedulingHorizonReached", { remaining: tasksToMove });
  }
  ```

## Next Steps

1. Fix Todoist `getTasks` pagination and normalization.
2. Make EventBus synchronous to satisfy interface typing.
3. Add scheduler horizon and event spelling cleanup.
4. Introduce a few core unit tests (allocator, gaps, initial selection).
5. Tighten tooling (lint-staged with ESLint, add `typecheck`, adjust deps).

Once you confirm, these changes can be applied in a focused PR along with tests.
