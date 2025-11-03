# todoist-resync

A small CLI that reschedules Todoist tasks into available Google Calendar slots. It walks forward from “today”, finds gaps within defined working hours, and updates each task’s due datetime accordingly.

## Quick Start

Prerequisites

- Bun ≥ 1.2.10
- Todoist API token
- Google Calendar API key and a calendar ID (calendar must be readable with the key)

Install

```bash
bun install
```

Run a sync

```bash
bun src/run.ts sync \
  --todoistToken "$TODOIST_TOKEN" \
  --googleApiKey "$GOOGLE_API_KEY" \
  --calendarId "$GOOGLE_CALENDAR_ID"
```

The CLI emits progress via an in-process event bus; you’ll see step-by-step logs in the console.

## Configuration

Core scheduling parameters live in `src/lib/constants.ts`:

- `WORKING_DAY_START_HOUR`, `WORKING_DAY_FINISH_HOUR`
- `MAX_TASKS_PER_DAY`, `DEFAULT_TASK_MINUTES`

Adjust these to fit your schedule. Changes apply on the next run.

## Project Structure

- `src/run.ts` — CLI entry (Brocli) exposing `sync`
- `src/lib/core` — scheduling and sync engine (`sync.ts`, `event-bus.ts`, helpers)
- `src/lib/google-calendar` — Google Calendar client
- `src/lib/todoist` — Todoist client
- `src/lib/types` — shared TypeScript types

## Development

Common commands

- Lint: `bun run lint`
- Format: `bun run format`
- Test: `bun test` (supports `--watch`)

Pre-commit hooks (Husky) run formatting on staged files and the test suite.

## Troubleshooting

- 403/404 from Google API: verify the Calendar API is enabled, the calendar ID is correct, and the calendar is accessible with your API key.
- No tasks updated: ensure your Todoist token is valid and tasks have due dates; the scheduler only moves tasks that fit within configured working hours and caps per day.

## Notes

Built with [Bun](https://bun.sh) and TypeScript. Path aliases are configured in `tsconfig.json` (e.g., `@core`, `@types`).
