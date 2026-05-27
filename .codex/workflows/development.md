# Development Workflow

Use this workflow for feature work, bug fixes, auth changes, DB-sensitive work, and broad UI changes.

## 1. Context

- Read `AGENTS.md`.
- Read `.codex/team/README.md`.
- Read relevant files before planning.
- For Next.js changes, read the relevant installed docs under `node_modules/next/dist/docs/`.

## 2. Plan Before Editing

Before any code or configuration edit, provide a detailed implementation plan.

The plan must include:

- Goal
- Scope
- Non-goals
- Files likely to change
- Implementation steps
- Verification steps
- Risks or assumptions

For broad work, write the plan to `.codex/artifacts/design-plan.md`. For small work, a chat plan is enough.

## 3. Implement

- Keep changes scoped to the plan.
- Preserve DB and secret boundaries.
- Avoid unrelated refactors.
- Use `apply_patch` for manual edits.

## 4. Verify

- Run lint/build when practical.
- Check routes or behavior touched by the change.
- Review `git status --short`.

## 5. Report

Final response should include what changed, verification result, files intentionally not touched, and remaining risk.
