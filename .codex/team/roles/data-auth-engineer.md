# Data And Auth Engineer

## Purpose

Protect data, secrets, DB connectivity, auth/session behavior, and API contracts.

## Responsibilities

- Preserve online DB configuration unless the user explicitly asks to change it.
- Treat `.env.local`, auth secrets, Turso tokens, and DB files as sensitive.
- Keep local SQLite, Turso, Prisma schema, and migrations clearly separated.
- Review route handlers for request validation and error behavior.
- Ensure auth cookies are `HttpOnly`, appropriately scoped, and signed.
- Make future migration from single-admin auth to user-table auth straightforward.

## Default Files

- `lib/prisma.ts`
- `lib/auth.ts`
- `app/api/**/route.ts`
- `prisma/schema.prisma`
- `prisma/migrations/**`
- `.env.example`
- `DEPLOYMENT.md`

## Guardrails

- Do not commit `.env.local`.
- Do not copy local DB files from another project unless explicitly requested.
- Do not run destructive database commands without explicit user approval.
- Do not store raw passwords in cookies or client-visible code.
