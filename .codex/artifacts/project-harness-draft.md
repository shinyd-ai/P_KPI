# P_KPI2 Project Harness Draft

## Purpose

This harness adapts the common harness and quality-loop expectations to the
P_KPI2 project. Use it for substantial work that changes product behavior,
Next.js code, data/auth behavior, UI, reports, operational settings, or
public-facing text.

Tiny low-risk tasks may use a shorter chat-only version, but development work
must still follow the project rule to plan before editing.

## Harness Trigger

Apply this project harness by default for:

- Feature implementation or behavior changes.
- Bug fixes with regression risk.
- Reviews of code, documents, plans, workflows, reports, or analysis.
- Responsive UI work in `app/` or `components/`.
- Auth, session, API, Prisma, database, migration, environment, or deployment
  changes.
- KPI, trend, review, retrospective, notification, or automation logic.
- Work involving sensitive personal data, secrets, legal/security/privacy
  concerns, or operational impact.

Skip or compress the harness for:

- Direct explanations.
- Simple translations.
- Small wording rewrites.
- Obvious formatting-only changes.

## Start-Of-Work Contract

Before editing code, configuration, database files, deployment files, or
filesystem artifacts, define:

### Goal

State the concrete outcome the user expects.

### Success Criteria

List observable conditions that prove the work is done. Prefer route behavior,
UI state, API response, build output, persisted data, or generated artifact
checks.

### Failure Criteria

List conditions that would make the change unacceptable, such as broken build,
lost data, auth bypass, mobile overflow, misleading KPI calculation, or
unverified deployment assumptions.

### Verification Method

Name the checks that will be run or the reason a check is not practical:

- `npm.cmd run lint`
- `npm.cmd run build`
- route smoke tests
- browser checks for changed UI on desktop and mobile
- API dry-runs for route handlers
- Prisma generation or migration checks for schema work
- manual review of changed files and `git status --short`

## Planning Template

Use this template in chat for small work and in
`.codex/artifacts/design-plan.md` for broad or multi-file work.

```md
## Goal

## Scope

## Non-goals

## Files Likely To Change

## Implementation Steps

## Verification Steps

## Risks Or Assumptions
```

## Role Checkpoints

Use the relevant `.codex/team/roles/` guides as review lenses.

### Product Planner

- Is the user goal concrete and bounded?
- Are must-have and optional items separated?
- Are acceptance criteria locally verifiable?
- Are DB, auth, deployment, and route risks called out before implementation?

### UX Researcher

- Does the flow match repeated daily, weekly, or monthly use?
- Are labels, empty states, mobile touch targets, and repeated steps clear?
- Are recommendations based on existing app behavior or user examples?

### Frontend Designer

- Does the UI remain quiet, dense, and productivity-focused?
- Are desktop and mobile layouts both considered?
- Are Tailwind responsive prefixes used where needed?
- Are nested cards, decorative clutter, oversized tool-surface headings, and
  visible tutorial text avoided?

### Next.js Engineer

- For Next.js code edits, were relevant installed docs under
  `node_modules/next/dist/docs/` checked first?
- Are App Router conventions, route handlers, metadata, proxy behavior, and
  server/client boundaries preserved?
- Are generated `.next/` files left untouched?

### Data And Auth Engineer

- Are `.env.local`, auth secrets, Turso tokens, and DB files protected?
- Are local SQLite, Turso, Prisma schema, and migrations kept separate?
- Are request validation, error behavior, cookies, and session boundaries
  reviewed?
- Are destructive database operations avoided unless explicitly approved?

### Analytics Engineer

- Are KPI names, aggregation windows, and derived calculations explicit?
- Are empty data, partial completion, and result-only records handled?
- Are planned, completed, and manually entered values labeled distinctly?
- Is the UI avoiding false precision from incomplete data?

### Content Automation Designer

- Is rule-based automation separated from LLM-assisted interpretation?
- Are generated outputs traceable to source records?
- Are extraction, summarization, rewriting, and recommendation steps distinct?
- Does the user preview and explicitly save or publish generated content?

### Product Editor

- Is Korean copy natural, concise, and consistent?
- Are facts, interpretation, and next actions separated in review outputs?
- Does the copy preserve the user's voice instead of becoming generic?

### Security Reviewer

- Could personal goal, health, finance, investment, or reflection data leak
  through client bundles, logs, errors, public routes, or broad API access?
- Are dependency, environment, CORS, cookie, and database changes justified?
- Are destructive or export actions confirmed and auditable where needed?

### Deployment Operator

- Are environment variables, build commands, migrations, backup, rollback, and
  recovery implications clear?
- Is local-only success distinguished from deployment readiness?
- Are production-facing configuration changes paired with a verification path?

### QA Release Reviewer

- Were changed files and worktree state reviewed?
- Were lint/build checks run when practical?
- Were changed routes smoke-tested?
- For frontend changes, was desktop and mobile behavior actually checked?

## Quality Loop

Use this loop when one pass is not enough: important implementation, risky bug
fixes, broad UI work, auth/data changes, deployment changes, public-facing
documents, or analysis where failure would cause meaningful rework.

1. Define goal, success criteria, failure criteria, and verification method.
2. Draft or implement the smallest scoped change that can meet the criteria.
3. Review against the role checkpoints and failure criteria.
4. Fix failures or narrow scope if the change is too risky.
5. Re-check with the planned verification method.
6. Report verification, pass status, and residual risk.

For simple changes, run a compressed loop:

1. Plan.
2. Implement.
3. Review changed file.
4. Run the most relevant check.
5. Report any unverified risk.

## Verification Matrix

| Change Type | Minimum Verification |
| --- | --- |
| Text/artifact only | Re-read changed file, check required sections, `git status --short` |
| UI in `app/` or `components/` | Lint/build when practical, route smoke test, desktop and mobile browser check |
| Next.js route/API | Relevant Next.js docs check, lint/build, route/API smoke test |
| Prisma schema/migration | Prisma generate, migration review, local DB impact note, deployment DB note |
| Auth/session/proxy | Lint/build, protected/public route checks, cookie/session risk review |
| KPI or analytics logic | Edge-case review, sample data check, labels/aggregation review |
| Automation/report generation | Source traceability check, preview/save behavior check, copy review |
| Deployment/config/scripts | Build check, env var review, rollback or recovery note |

## End-Of-Work Report

Finish substantial work with:

```md
## Verification Performed

- ...

## Harness Pass Status

Pass / Pass with residual risk / Blocked

## Remaining Risk Or Human Review Items

- ...
```

Also include changed files, checks that were skipped, and why skipped checks were
not practical.

## Project-Specific Guardrails

- Preserve `.env.local` and secrets. Do not expose them in logs, client code, or
  reports.
- Do not edit generated `.next/` output.
- Do not run destructive database or filesystem commands without explicit user
  approval.
- Keep desktop behavior intact during mobile responsive work unless the user
  asks otherwise.
- Prefer existing app patterns over new dependencies or broad refactors.
- Do not treat local verification as production readiness when migrations,
  remote DBs, schedulers, webhooks, or environment variables are involved.
- For current external facts, package behavior, laws, prices, or operational
  status, verify against current sources before relying on memory.
