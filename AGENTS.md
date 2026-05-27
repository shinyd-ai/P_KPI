<!-- BEGIN:nextjs-agent-rules -->
# Next.js Project Rules

This project uses a Next.js version with breaking changes. Before writing or
editing Next.js code, read the relevant guide in `node_modules/next/dist/docs/`.
Follow deprecation notices and prefer the documented APIs for this installed
version over assumptions from older Next.js versions.
<!-- END:nextjs-agent-rules -->

# Codex Working Rules

## Mandatory Implementation Planning

Before making any code, configuration, database, deployment, or filesystem
change for a user-requested development task, first provide a detailed
implementation plan.

The plan must include:

- Goal
- Scope
- Non-goals
- Files likely to change
- Implementation steps
- Verification steps
- Risks or assumptions

For very small changes, the plan may be concise but must still be explicit. For
broad or multi-file work, create or update `.codex/artifacts/design-plan.md`
before implementation.

## Codex Team Configuration

Use the Codex-native team model in `.codex/team/README.md` for project work.
The role guides under `.codex/team/roles/` should shape planning and review:

- `product-planner`
- `frontend-designer`
- `nextjs-engineer`
- `data-auth-engineer`
- `qa-release-reviewer`

Use `.codex/workflows/development.md` for feature work, bug fixes, auth changes,
DB-sensitive work, and broad UI changes.

## Responsive Work

For mobile responsive work, use this Codex-native workflow instead of the
Claude-specific commands and agents under `.claude/`.

Default scope, unless the user narrows it:

- `app/`
- `components/`

Recommended flow:

1. Analyze layout risks in `app/` and `components/`.
   - Start with `app/layout.tsx`.
   - Check layout components such as sidebars and navigation.
   - Review page components for fixed widths, overflow, missing responsive
     Tailwind prefixes, tight touch targets, and mobile padding issues.
2. Write or update a concise analysis report when the work is broad.
   - Preferred path: `.codex/artifacts/analysis-report.md`.
   - If only a small fix is requested, summarize the analysis in the chat
     instead of creating an artifact.
3. Prepare a concrete implementation plan before broad changes.
   - Preferred path: `.codex/artifacts/design-plan.md`.
   - Keep desktop behavior intact unless the user explicitly asks otherwise.
   - Use Tailwind responsive prefixes such as `sm:`, `md:`, and `lg:`.
4. Implement narrowly.
   - Follow the plan.
   - Avoid unrelated refactors.
   - If a mobile bottom navigation is needed, prefer mobile-only rendering with
     `md:hidden`; desktop sidebars should generally use `hidden md:flex`.
5. Verify after changes.
   - Review the changed files.
   - Run available checks such as lint/build when practical.
   - For frontend changes, open the local app in the browser when the route and
     server are available, and check both mobile and desktop viewports.
   - Preferred report path for broad work:
     `.codex/artifacts/verification-report.md`.

Legacy `.claude/` files may be used as reference material, but Codex should not
depend on Claude slash commands or Claude agent names.
