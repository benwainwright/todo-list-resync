# Repository Guidelines

## Project Structure & Module Organization

- `src/run.ts`: CLI entry (via Brocli) exposing the `sync` command.
- `src/lib/core`: Scheduling and sync engine (`sync.ts`, `event-bus.ts`, helpers).
- `src/lib/google-calendar`: Google Calendar client and types.
- `src/lib/todoist`: Todoist client and types.
- `src/lib/types`: Shared TS types and API contracts; path aliases via `tsconfig.json` (e.g., `@core`, `@types`).
- Tests live next to code, e.g., `src/lib/core/event-bus.test.ts`.

## Build, Test, and Development Commands

- Install deps: `bun install`
- Lint: `bun run lint` (ESLint recommended + TS rules)
- Format: `bun run format` (Prettier, 2-space tabs)
- Test: `bun test` (add `--watch` while iterating)
- Run CLI locally:
  ```bash
  bun src/run.ts sync \
    --todoistToken "$TODOIST_TOKEN" \
    --googleApiKey "$GOOGLE_API_KEY" \
    --calendarId "$GOOGLE_CALENDAR_ID"
  ```

## Coding Style & Naming Conventions

- Language: TypeScript (ESM, strict). Prefer named exports; keep modules small.
- Files/folders: kebab-case for files (e.g., `event-bus.ts`), `index.ts` for barrels.
- Imports: use path aliases (`@core`, `@google-calendar`, `@todoist`, `@types`, `@constants`).
- Formatting: Prettier (2 spaces). Lint with ESLint + typescript-eslint; fix warnings before commit.

## Testing Guidelines

- Framework: Bun test (`bun test`). Co-locate tests as `*.test.ts` beside the source.
- Focus: unit tests for pure helpers in `core`; mock external APIs for clients.
- Example: see `src/lib/core/event-bus.test.ts` for style and expectations.

## Commit & Pull Request Guidelines

- Messages: short, imperative, scoped when useful.
  - Examples: `add pre-commit checks`, `fix bug in event bus`, `update events`.
- Pre-commit: Husky runs `lint-staged` and `bun test`; ensure both pass locally.
- PRs: include purpose, approach, linked issues, and local run/test instructions. If behavior changes, add a brief example CLI invocation and expected logs (EventBus output).

## Security & Configuration Tips

- Secrets: never commit tokens/keys. Pass via env vars to the CLI (see run example).
- Google Calendar/Todoist: ensure provided IDs/keys are valid; avoid real data in tests.
- Path aliases require running tools with the project `tsconfig.json` (Bun handles this by default).
