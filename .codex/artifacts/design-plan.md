# Monthly Retrospective Plan

## Goal

Turn the previous pasted-text blog summary prototype into a real monthly retrospective workflow. The app should help the user review one month, see automatic no-LLM summaries from existing records, write their own reflection, and preview a blog-ready draft.

## Scope

- Add a `/retrospective` route.
- Add a `MonthlyRetrospective` persistence model and API.
- Read existing monthly plans and monthly results for the selected month.
- Show automatic no-LLM summaries from stored plan status, result memos, and result metrics.
- Provide manual reflection fields:
  - month summary
  - lessons
  - risks/issues
  - mood/feeling
  - blog opening
- Generate a deterministic blog draft preview in the browser.
- Change the sidebar item from blog summary to monthly retrospective.
- Redirect `/blog-summary` to `/retrospective`.

## Non-goals

- No LLM generation in this pass.
- No automatic publishing to an external blog platform.
- No removal of the existing AI review route.
- No changes to the meaning of existing monthly plans, daily logs, or daily plans.

## Files Likely To Change

- `prisma/schema.prisma`
- `prisma/migrations/*/migration.sql`
- `app/api/retrospectives/[year]/[month]/route.ts`
- `app/retrospective/page.tsx`
- `app/blog-summary/page.tsx`
- `components/layout/Sidebar.tsx`

## Implementation Steps

1. Add `MonthlyRetrospective` to Prisma with a JSON string content field.
2. Add and apply a local migration for the new table.
3. Add `GET` and `PUT` route handlers for monthly retrospective content.
4. Build a client page that loads monthly plans, monthly results, and retrospective content.
5. Render KPI cards, category grouped performance, manual reflection inputs, and blog draft preview.
6. Save manual reflection content with an explicit save action.
7. Update navigation and redirect the old prototype route.
8. Run generation, lint, and build checks.

## Verification Steps

- `npm.cmd run db:generate`
- Apply the local migration.
- `npm.cmd run lint`
- `npm.cmd run build`
- Confirm `/retrospective` is present in the build output.
- Smoke test route response when a dev server is available.

## Risks Or Assumptions

- Deployment databases will need the new migration applied before the route can save retrospectives.
- The content JSON is intentionally flexible so future fields and AI-assisted outputs can be added without repeated schema churn.
- Automatic summaries are deterministic and should not claim semantic insight.
- AI-assisted rewriting should be added as a separate, explicit action in a later pass.

# Discord Daily Notification Plan

## Goal

Send a daily Discord reminder that summarizes today's KPI check state and links back to the daily page.

## Scope

- Add a protected route handler for daily Discord notifications.
- Build a server-side message from today's daily plans.
- Send the message to a Discord webhook configured by environment variable.
- Support a dry-run mode for local verification without posting to Discord.
- Document required environment variables and a scheduler-friendly call pattern.

## Non-goals

- No app push notifications or browser push notifications.
- No Discord bot OAuth, slash commands, or interactive Discord components.
- No database schema changes.
- No built-in scheduler process; external cron will call the route.

## Files Likely To Change

- `app/api/notifications/discord/daily/route.ts`
- `lib/discord-daily-notification.ts`
- `proxy.ts`
- `.env.example`
- `DEPLOYMENT.md`

## Implementation Steps

1. Add a helper that finds today's daily plans and formats a concise Discord message.
2. Add a webhook sender using `DISCORD_WEBHOOK_URL`, with safe error handling.
3. Add `GET` and `POST` route handlers protected by `CRON_SECRET`.
4. Allow the notification route through `proxy.ts` so external schedulers can call it.
5. Add environment examples and deployment notes.
6. Run lint and build checks.

## Verification Steps

- `npm.cmd run lint`
- `npm.cmd run build`
- Call the route with `dryRun=1` and a valid secret to verify the generated payload without sending.

## Risks Or Assumptions

- `DISCORD_WEBHOOK_URL` and `CRON_SECRET` must be configured outside the repository.
- An external scheduler must call the route at the desired daily time.
- Date matching follows the existing daily plan API convention of comparing `YYYY-MM-DD` strings derived from stored plan dates.

# Weekly Time Block Schedule Plan

## Goal

Turn the static weekly schedule prototype into a usable time-block workflow. The user should be able to place important daily plans on a weekly time grid, record status and actual time, and see simple weekly time-allocation summaries.

## Scope

- Add a `TimeBlock` persistence model.
- Add a `/api/time-blocks` route handler for weekly fetch, create, update, and delete.
- Connect `/schedule` to real data instead of static samples.
- Show unplaced daily plans for the selected week.
- Allow manual creation of time blocks with date, start/end time, title, status, source plan, actual minutes, and note.
- Keep the weekly grid as the main interaction surface.

## Non-goals

- No drag-and-drop in this pass.
- No recurring time blocks.
- No external calendar sync.
- No automatic completion sync between `DailyPlan.completed` and `TimeBlock.status`.
- No monthly calendar view yet.

## Files Likely To Change

- `prisma/schema.prisma`
- `prisma/migrations/20260617060000_add_time_blocks/migration.sql`
- `app/api/time-blocks/route.ts`
- `app/schedule/page.tsx`
- `components/layout/Sidebar.tsx`
- `scripts/sync-local-db-to-turso.mjs`

## Implementation Steps

1. Add `TimeBlock` relations to daily plans, monthly plans, and goals.
2. Add a migration for the new table and indexes.
3. Add a route handler that can fetch one week and mutate individual blocks.
4. Replace static schedule data with fetched blocks and daily plans.
5. Add a compact create/edit panel instead of full drag-and-drop.
6. Update the Turso sync script so time blocks are not dropped during overwrite syncs.
7. Run Prisma generation, lint, and build checks.

## Verification Steps

- `npm.cmd run db:generate`
- Apply local migrations with Prisma when practical.
- `npm.cmd run lint`
- `npm.cmd run build`
- Confirm `/schedule` and `/api/time-blocks` appear in the build output.
- Smoke test route behavior if a local server is available.

## Risks Or Assumptions

- Turso production needs the new migration SQL applied before Vercel can save time blocks.
- Time blocks use minutes-from-midnight to avoid timezone range-query issues.
- The first version intentionally keeps daily-plan completion and time-block status separate.
