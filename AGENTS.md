# Agent Guidelines

Read [PROJECT_CONTEXT.md](PROJECT_CONTEXT.md) before starting any task.

## Rules & Constraints

- NEVER run `npm run build` while the dev server is running (it corrupts `.next` and every route returns 404). Verify with `npx tsc --noEmit` and `npm run lint`.
- NEVER start a second dev server; assume `npm run dev` is already running.
- NEVER delete `.next` yourself; tell the user to restart the dev server instead.
