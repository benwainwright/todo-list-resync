# Code Review Findings

## Critical Bugs

### 1. Interval allocation reports success without creating an interval
- **File:** `src/lib/core/interval-allocator.ts`
- **Issue:** `tryAllocate` returns `true` after inspecting the first gap, even when the task could not be scheduled (`candidateInterval` is not engulfed by the gap). The caller removes the task from the work queue whenever `true` is returned, so this bug silently drops tasks without moving them to the calendar.
- **Fix suggestion:** Only return `true` after a successful allocation, and continue iterating over the remaining gaps otherwise.

### 2. Day allocator stops after a single successful assignment
- **File:** `src/lib/core/generate-move-events-for-given-day.ts`
- **Issue:** The loop condition `taskToAllocate < tasksToMove.length - allocator.allocatedIntervals.length` causes the loop to exit as soon as one task is allocated (because both `tasksToMove.length` and `allocatedIntervals.length` decrease/increase in lock-step). As a result, at most one task is scheduled per day even if more capacity is available.
- **Fix suggestion:** Iterate while `taskToAllocate < tasksToMove.length` and break manually when there are no more gaps or the allocator fails, instead of tying the condition to the number of allocated intervals.

## Functional Bugs

### 3. Working day interval ends at the wrong minute/second
- **File:** `src/lib/core/generate-work-day-interval.ts`
- **Issue:** `dayEnd` derives from `getEndOfDayN(offset)` (which returns 23:59:59.999) and then overrides only the `hour`. The interval therefore ends at `endHour:59:59.999`, not at the top of the hour. Tasks can overflow the intended working window by almost an hour.
- **Fix suggestion:** Base both `dayStart` and `dayEnd` on `getStartOfDayN(offset)` (or explicitly reset minutes/seconds) before setting the hour, minute, second, and millisecond fields.

## Performance / Reliability Issues

### 4. Recomputing gaps for every allocation attempt
- **File:** `src/lib/core/interval-allocator.ts`
- **Issue:** The getter `gaps` recalculates an expensive `Interval.xor` every time it is accessed. `tryAllocate` calls this getter once per gap iteration, meaning the entire gap set is recomputed repeatedly. This grows quadratically with the number of tasks/events.
- **Fix suggestion:** Cache the current gaps or update them incrementally when a new interval is allocated.

### 5. Debug logging leaks into production
- **File:** `src/lib/core/find-occupied-intervals.ts`
- **Issue:** When `offset === 1`, every interval is logged to the console. This slows down production runs and pollutes logs.
- **Fix suggestion:** Remove the debug log or guard it behind an explicit debug flag.

