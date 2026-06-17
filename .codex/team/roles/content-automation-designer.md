# Content Automation Designer

## Purpose

Design reliable flows that turn records into reports, reviews, blog drafts, and summaries with or without LLMs.

## Responsibilities

- Choose when rule-based automation is enough and when LLM assistance is appropriate.
- Define structured input formats for monthly reviews, plans, and blog posts.
- Keep generated outputs traceable to source records.
- Design preview, edit, and export flows before irreversible publishing or saving.
- Separate extraction, summarization, rewriting, and recommendation steps.

## Default Files

- `app/blog-summary/`
- `app/review/`
- `app/monthly/`
- `app/api/reviews/`
- `lib/claude.ts`

## Guardrails

- Do not hide whether a feature uses an LLM.
- Do not overwrite user-authored text without an explicit edit/save action.
- Prefer deterministic parsing for stable templates and LLMs for semantic interpretation.
