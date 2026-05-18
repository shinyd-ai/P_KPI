# Vercel + Turso Deployment

This app is prepared for a private Vercel deployment backed by Turso.

## 1. Create the Turso database

Install and log in to the Turso CLI, then create a database:

```bash
turso auth signup
turso db create p-kpi2
turso db show --url p-kpi2
turso db tokens create p-kpi2
```

Save the URL as `TURSO_DATABASE_URL` and the token as `TURSO_AUTH_TOKEN`.

## 2. Apply the existing schema to Turso

Prisma migration commands should still target the local SQLite file. For Turso,
apply the generated SQL files with the Turso CLI:

```bash
turso db shell p-kpi2 < ./prisma/migrations/20260516065204_init/migration.sql
turso db shell p-kpi2 < ./prisma/migrations/20260516115527_add_monthly_plan_results/migration.sql
```

## 3. Configure Vercel environment variables

Set these in Vercel Project Settings > Environment Variables:

```txt
TURSO_DATABASE_URL=libsql://...
TURSO_AUTH_TOKEN=...
BASIC_AUTH_USERNAME=...
BASIC_AUTH_PASSWORD=...
ANTHROPIC_API_KEY=...
```

`ANTHROPIC_API_KEY` is only needed if the monthly review AI feature should work.

## 4. Deploy

Connect the repository to Vercel, or deploy with the Vercel CLI:

```bash
npm run build
vercel
vercel --prod
```

On production, the app returns `503` if `BASIC_AUTH_USERNAME` or
`BASIC_AUTH_PASSWORD` is missing. This prevents accidental public deployment.
