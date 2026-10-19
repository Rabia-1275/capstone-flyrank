# ProposalAI deployment checklist

Production URL: https://capstone-flyrank-five.vercel.app
Vercel root directory: `capstone-flyrank-next`

---

## 1. Pre-deploy

### Code and tests

- [ ] Branch is up to date with `main` and the PR has been reviewed.
- [x] `npx tsc --noEmit` passes (run in `capstone-flyrank-next/`).
- [ ] `npm run lint` reports 0 errors.
- [x] `npm run test:coverage` reports 0 failed tests and no unhandled errors. (13 files, 131 tests passed, see `docs/test-coverage-output.txt`.)
- [ ] Never run `npm run build` locally while `npm run dev` is running (it corrupts `.next`). Let Vercel build, or stop the dev server first.
- [ ] No `.env*` file is committed (`git status` is clean of env files).

### Environment variables (Vercel, Settings, Environment Variables)

Set every variable for **Production** and **Preview**. A variable set only for Production makes preview deployments fail in confusing ways.

| Variable | Production | Preview |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | [x] | [ ] |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | [x] | [ ] |
| `GROQ_API_KEY` (no `NEXT_PUBLIC_` prefix) | [x] | [ ] |
| `GROQ_MODEL` (optional) | [ ] | [ ] |
| `GROQ_MODEL_GENERATE` (optional) | [ ] | [ ] |
| `AI_DISABLED` (optional, `false` unless switching AI off) | [ ] | [ ] |
| `AI_LIMIT_ANALYZE_PER_HOUR` (optional) | [ ] | [ ] |
| `AI_LIMIT_GENERATE_PER_DAY` (optional) | [ ] | [ ] |
| `AI_LIMIT_SCORE_PER_DAY` (optional) | [ ] | [ ] |

- [ ] Variable names match `capstone-flyrank-next/.env.example`.
- [ ] After changing a variable, redeploy. Vercel does not apply new values to an existing deployment.

### Supabase

- [ ] Every file in `supabase/migrations/` has been run in the production project's SQL Editor (fresh project: run `supabase/schema.sql` once instead).
- [ ] Row Level Security is enabled on `profiles`, `projects`, `proposals` and `ai_usage`.
- [ ] Authentication, URL Configuration: Site URL and Redirect URLs include the production URL (and the preview URL pattern if you test previews).
- [ ] The model in `GROQ_MODEL` is still available on Groq.

### Rollback preparation

- [x] Note the current production deployment before deploying:
  - Deployment URL / ID: https://capstone-flyrank-five.vercel.app (Production deployment that was Ready before PR #2)
  - Git commit: `6bb91ce` (merge of PR #1)
- [x] Note the merge commit you are about to ship, so you can `git revert` it:
  - Merge commit: `e2a826c` (merge of PR #2, `feat/tests-and-audit`)

---

## 2. Deploy

- [x] Merge the PR into `main` (or click **Deploy** in Vercel). Done: PR #2 merged on 2026-10-19, commit `e2a826c`.
- [x] Watch the Vercel build log until the deployment shows **Ready**. Done: Production deployment is Ready.
- [ ] If the build fails, the old deployment stays live. Fix and push again; no rollback is needed. (Not needed this release: the production build succeeded. Two earlier Preview builds failed and were fixed before the merge.)

---

## 3. Post-deploy smoke test

Run these on the production URL, in a private window.

**Smoke test run on 2026-10-19 against commit `e2a826c`:**

| Check | Result | Evidence |
|---|---|---|
| Production deployment | Pass | Vercel showed `e2a826c` as Ready on `main`, status Current |
| Landing page loads | Pass | `/` rendered, axe 0 issues, Lighthouse ran on it |
| `/health` | Pass | "All Systems Operational", Supabase reachable, AI service configured |
| Login and session | Pass | Logged-in navbar shown on dashboard, profile, settings and proposals |
| Dashboard, profile, settings, proposals list | Pass | All rendered with real data, axe 0 issues on each |
| Open a saved proposal | Pass | The proposal page loaded with analysis, controls and text |
| Generate | Pass | After going back online, generate returned 200 in 5.31 s and the proposal text appeared |
| Error handling and Retry | Pass | While offline the error box with Retry appeared, and the next attempt recovered |
| 404 page | Pass | Custom "Page Not Found" page shown |

### Health

- [x] `/health` loads and shows the app as OK.
- [ ] `GET /api/health` returns HTTP 200 with `"status": "ok"`, `"supabase_reachable": true` and `"ai_configured": true`. (HTTP 503 with `"status": "degraded"` means Supabase is unreachable.)

### Auth

- [x] Log in with a test account. You land on the dashboard.
- [ ] Open `/dashboard` in a logged-out window. You are redirected to `/login`.
- [ ] Sign out works.

### Core AI flow

- [ ] `/proposals/new`: paste a job description (50 to 8000 characters), pick a platform, click **Analyze Job**. The analysis appears (summary, skill match, red flags, 3 questions, AI estimate).
- [x] Click **Generate Proposal**, then **Generate**. Text streams into the editor and the Stop button shows while it runs.
- [ ] Edit the text. "Unsaved changes" appears, then disappears after autosave (about 2 seconds).
- [ ] Click **Score proposal**. The score card appears with 5 breakdown rows.
- [ ] Change the status of the proposal in `/proposals`. The dashboard numbers update.

### Error states

- [x] An AI failure shows the red error box with a **Retry** button (screen readers announce it via `role="alert"`).
- [x] An unknown URL (for example `/does-not-exist`) shows the custom 404 page.
- [ ] Analyze with fewer than 50 characters keeps the button disabled.

### Usage limits

- [ ] When a user reaches a cap, the API returns HTTP 429 and the UI shows a rate-limit message instead of crashing. Defaults: 10 analyses per hour, 30 generations per day, 30 scores per day.
- [ ] Optional: temporarily set a limit to `1` on a preview deployment to see the message without using up the production quota.
- [ ] With `AI_DISABLED=true` the AI endpoints return HTTP 503 with a clear message.

Usage limits were not tested live. The caps are covered by unit tests in `src/lib`.

---

## 4. Rollback

Roll back if login, `/health` or the Analyze/Generate flow is broken in production.

**Option A: Vercel**

1. Vercel dashboard, project, **Deployments**.
2. Find the previous **Ready** deployment noted in step 1 (commit `6bb91ce`).
3. `...` menu, **Promote to Production** (or **Redeploy**).

**Option B: git**

```bash
git revert -m 1 e2a826c
git push origin main
```

**After rolling back**

- [ ] `/health` and `GET /api/health` are OK again.
- [ ] Log in with the test account.
- [ ] If the bad deploy ran a migration, check that the old code still works against the new schema.
- [ ] Write down what broke before re-deploying.

See also the [Rollback plan in the README](../README.md#rollback-plan).