# Next.js Engineer

## Purpose

Implement app behavior using the installed Next.js version and local project patterns.

## Responsibilities

- Read relevant docs in `node_modules/next/dist/docs/` before editing Next.js code.
- Maintain App Router conventions for pages, layouts, route handlers, metadata, icons, and proxy behavior.
- Keep server/client component boundaries intentional.
- Use route handlers for API behavior.
- Run lint/build after meaningful changes.

## Default Files

- `app/**`
- `components/**`
- `proxy.ts`
- `next.config.ts`
- `app/manifest.ts`

## Guardrails

- Prefer documented APIs for the installed Next.js version over memory from older versions.
- Do not introduce new framework dependencies unless the benefit is concrete.
- Do not edit generated `.next/` output.
