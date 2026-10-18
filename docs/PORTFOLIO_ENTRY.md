# ProposalAI: portfolio entry

## 1. Project brief

ProposalAI helps freelancers write stronger proposals in less time. On platforms like Upwork and Fiverr, writing a tailored proposal for every job takes so long that many freelancers send generic copy-paste messages that clients ignore. ProposalAI analyses a pasted job description against the freelancer's saved profile and projects, drafts a platform-specific proposal that uses only real skills and work, scores it honestly (including flagging claims the profile does not support), and tracks outcomes in a win-rate dashboard.

## 2. Live app

**URL:** https://capstone-flyrank-five.vercel.app

**WCAG 2.1 AA note.** An accessibility pass over the components fixed these issues:

- The tone and length `<select>` elements and the proposal textarea on the proposal page had no label. They now have screen-reader-only `<label htmlFor>` elements ("Tone", "Length", "Proposal text"). (1.3.1 Info and Relationships, 4.1.2 Name, Role, Value)
- The AI error box (with Retry) and the score error box now have `role="alert"`, so screen readers announce failures. The analyze error message on the new-proposal form has it too. (4.1.3 Status Messages)
- The icon-only "copy question" buttons only had a `title`. They now have an `aria-label` that includes the question. The main copy button has an `aria-label` as well. (4.1.2)
- The "×" buttons that remove a skill or portfolio link announced only "times". They now read "Remove skill React", "Remove link https://...". (2.4.6, 4.1.2)
- Visible labels that were not linked to their inputs are now linked with `htmlFor`/`id`: Platform and Job Description (new proposal), Full Name, Headline, Tone, Skills and Portfolio Links (profile), Title, Description and Link (projects), Account Email (settings). (1.3.1, 3.3.2 Labels or Instructions)
- No `<img>` elements without `alt` were found. Icons come from Lucide, which renders them with `aria-hidden="true"`.

This is a code-level audit, not a full WCAG conformance audit. Automated and manual results go in section 5.

## 3. Repository and README

- **Repository:** https://github.com/Rabia-1275/capstone-flyrank
- **README:** https://github.com/Rabia-1275/capstone-flyrank#readme
  - [Architecture and data flow](https://github.com/Rabia-1275/capstone-flyrank#architecture-and-data-flow)
  - [AI design decisions](https://github.com/Rabia-1275/capstone-flyrank#ai-design-decisions), including [the prompts](https://github.com/Rabia-1275/capstone-flyrank#the-prompts) and [why they are written this way](https://github.com/Rabia-1275/capstone-flyrank#why-the-prompts-are-written-this-way)
  - [Local setup](https://github.com/Rabia-1275/capstone-flyrank#local-setup)
  - [Testing](https://github.com/Rabia-1275/capstone-flyrank#testing)
  - [Rollback plan](https://github.com/Rabia-1275/capstone-flyrank#rollback-plan)
  - [Known limitations](https://github.com/Rabia-1275/capstone-flyrank#known-limitations)

## 4. Testing evidence

Vitest and React Testing Library. Numbers below are copied from the last `npm run test:coverage` run, saved in full in [`docs/test-coverage-output.txt`](test-coverage-output.txt).

```text
 Test Files  11 passed (11)
      Tests  127 passed (127)
```

| Scope | % Stmts | % Branch | % Funcs | % Lines |
|---|---|---|---|---|
| All files | 58.89 | 42.99 | 48.52 | 60.09 |
| `src/components` | 50.17 | 37.68 | 37.68 | 52.29 |
| `src/lib` | 96.94 | 84.28 | 96.77 | 96.42 |

Components with tests: 7 of 11 (Navbar, NewProposalForm, ProfileCompleteness, ProfileForm, ProposalEditor, ProposalStatusSelect, ProposalsList). Not yet tested: DashboardContent, HealthDashboard, ProjectsSection, SettingsForm. `src/lib/ai.ts` is excluded from coverage because it calls the Groq API; its Zod schemas are tested directly.

**Screenshot:** TODO(me) add a screenshot of the terminal coverage table and link it here.

## 5. Lighthouse and accessibility

**Lighthouse (production URL):**

| Page | Performance | Accessibility | Best Practices | SEO |
|---|---|---|---|---|
| `/` | TODO(me) | TODO(me) | TODO(me) | TODO(me) |
| `/proposals/[id]` | TODO(me) | TODO(me) | TODO(me) | TODO(me) |

TODO(me) add the Lighthouse report screenshot(s).

**WAVE / axe output:** TODO(me) run WAVE or axe DevTools on the proposal page and paste the summary (errors, contrast errors, alerts) here, with a screenshot.

**One concrete fix: labels on the proposal page controls**

- **Before:** the tone `<select>`, length `<select>` and proposal `<textarea>` had no label, so a screen reader announced them as "combo box" and "edit text" with no name. Automated checkers report this as a missing form label.
- **After:** each control has an `id` and a matching screen-reader-only `<label htmlFor>` ("Tone", "Length", "Proposal text"). The visual design is unchanged. A test in `ProposalEditor.test.tsx` finds all three controls with `getByLabelText`.
- **Before screenshot:** TODO(me)
- **After screenshot:** TODO(me)

## 6. Deployment checklist, error states, rollback

- **Deployment checklist:** [`docs/DEPLOYMENT_CHECKLIST.md`](DEPLOYMENT_CHECKLIST.md) (pre-deploy, deploy, post-deploy, rollback)
- **Rollback plan:** [README, Rollback plan](https://github.com/Rabia-1275/capstone-flyrank#rollback-plan)

Error-state screenshots:

- AI error box with Retry: TODO(me)
- Usage-limit (rate limit) message: TODO(me)
- Custom 404 page: TODO(me)
- `/health` page: TODO(me)

## 7. Reflection

### TODO(me) write this myself
