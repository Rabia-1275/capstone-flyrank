# Agent Guidelines

Read [PROJECT_CONTEXT.md](../PROJECT_CONTEXT.md) before starting any task.

## Rules & Constraints

- NEVER run `npm run build` while the dev server is running (it corrupts `.next` and every route returns 404). Verify with `npx tsc --noEmit` and `npm run lint`.
- NEVER start a second dev server; assume `npm run dev` is already running.
- NEVER delete `.next` yourself; tell the user to restart the dev server instead.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
