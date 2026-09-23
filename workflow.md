# Workflow Comparison — Settings Form

## Round 1 (Vague Prompt)
- Prompt used: "Add a settings form to the app."
- What was built: A working SettingsForm with display name, email, role, notifications toggle, and bio — state managed with manual `useState`, validation via an inline `validateSettings()` function, "Save" wired to a `handleSave` function in `SettingsPage.jsx`.
- What broke / was missing:
  - Email validation relied on a basic regex inside a hand-rolled `validateSettings()` function, and the input also had `type="email"`, so on first click it showed the browser's native popup ("Please include an '@' in the email address") rather than a custom, styled error.
  - The "Save settings" button's handler (`handleSave`) only called `console.log('Saved settings:', values)` — it looked fully functional in the UI (success message shown) but never actually persisted anything. Refreshing the page wiped every field back to empty.
  - No tests were written or requested, so nothing verified the validation logic actually worked beyond a manual click-through.
  - Accessibility (label-to-input linking) was not confirmed either way — nothing in the prompt asked for it, so it was left to chance.
- Time to "done" (including my own manual testing to find these gaps): ~25–30 min.

## Round 2 (Precise Prompt)
- Prompt used: file references to the existing SettingsForm/SettingsPage, explicit constraint to use react-hook-form + zod instead of native HTML5 validation, a labeled-accessibility requirement, a localStorage persistence requirement, and an explicit "write tests, then run them" verification step.
- What worked well:
  - Validation now comes from an explicit zod schema (`src/components/settingsSchema.js`) with custom messages per field, e.g. "Please enter a valid email address" — no browser popups.
  - The old `console.log`-only save handler is gone. `SettingsForm` now writes to `localStorage` under the key `"settings"` and reloads saved values on mount via `loadSavedSettings()` — confirmed by testing "Save → refresh → data still there."
  - Every input has a properly linked `<label htmlFor="...">`.
  - 4 unit tests (Vitest + React Testing Library, new `SettingsForm.test.jsx`) cover invalid email, bio over 200 chars, valid submit + localStorage save, and reload-after-remount — all 4 passed, and the production build succeeded.
- Time to "done": ~20 min to run the prompt, review the diff, and re-check the same manual cases from Round 1 — noticeably less review/fixing time than Round 1, even though the agent did more work up front.

## Specific Diffs
- `src/components/SettingsForm.jsx`: Round 1 used `useState` + an inline `validateSettings()` regex function; Round 2 replaced this entirely with `react-hook-form` + `zodResolver(settingsSchema)`.
- New file `src/components/settingsSchema.js` in Round 2 — did not exist in Round 1 — centralizes validation rules and exports `loadSavedSettings()`/`STORAGE_KEY` for persistence.
- New file `src/components/SettingsForm.test.jsx` in Round 2 — Round 1 had zero test coverage.
- `src/pages/SettingsPage.jsx`: Round 1 had a `handleSave(values) { console.log(...) }` function passed to the form as `onSave` — Round 2 removed this entirely because persistence now happens inside `SettingsForm` itself via `localStorage`.
- `vite.config.js`: Round 2 added a `test` block (`environment: 'jsdom'`, `setupFiles`) so Vitest could run — Round 1 had no test tooling configured at all.

## AI Mistake I Caught
Round 1's "Save settings" button looked completely functional — it showed a green success message every time. But when I inspected `SettingsPage.jsx`, the save handler was only doing `console.log('Saved settings:', values)`. Nothing was actually persisted anywhere. I only caught this because I manually refreshed the page after saving and watched all the data disappear — the AI never flagged that the "success" message was misleading.

## Takeaway
Round 2 took longer to kick off (a much longer prompt to write), but the total time including review and manual verification was shorter than Round 1, because almost nothing needed fixing afterward — the tests had already caught the cases I would have had to manually hunt for. Round 1 looked "done" faster but hid a real, user-facing bug (fake persistence) that only surfaced when I tested it properly.