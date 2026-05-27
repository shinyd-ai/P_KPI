# Codex Team Configuration

This directory defines the Codex-native working model for P_KPI2.

It replaces the legacy Claude responsive harness as the primary project workflow. The `.claude/` directory may still be used as reference material, but new planning, implementation notes, and verification notes should live under `.codex/`.

## Team

- `product-planner`: Clarifies user intent, scope, UX flows, release impact, and acceptance criteria before implementation.
- `frontend-designer`: Owns visual direction, responsive behavior, interaction details, and consistency across `app/` and `components/`.
- `nextjs-engineer`: Owns Next.js App Router implementation, routing, server/client component boundaries, and build correctness.
- `data-auth-engineer`: Owns Prisma, Turso/local DB separation, API handlers, authentication, sessions, and secrets handling.
- `qa-release-reviewer`: Owns verification, regression risk, lint/build checks, route smoke tests, and release notes.

## Default Workflow

1. Read local context first: `AGENTS.md`, this file, relevant source files, and installed Next.js docs under `node_modules/next/dist/docs/` when editing Next.js code.
2. Produce a detailed implementation plan before editing code or config.
3. Implement narrowly, preserving DB and secret boundaries.
4. Verify with lint/build and route checks when practical.
5. Summarize changed files, verification results, and remaining risk.

## Artifact Paths

- Analysis: `.codex/artifacts/analysis-report.md`
- Plan: `.codex/artifacts/design-plan.md`
- Implementation log: `.codex/artifacts/implementation-log.md`
- Verification: `.codex/artifacts/verification-report.md`

Use artifacts for broad or multi-file work. Keep small one-file changes in chat unless a persistent record would help.
