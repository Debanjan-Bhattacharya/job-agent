# job-agent

## What's built

### Day 1 — complete
- Next.js 14 app with TypeScript, Tailwind CSS, ESLint, App Router
- Supabase client (`src/lib/supabase.ts`)
- OpenAI client (`src/lib/openai.ts`)
- Home page with JD textarea and scored result display
- Deployed: https://job-agent-nine-rho.vercel.app

### Day 2 — complete
- `prompts/resume-parse.md` — GPT-4o prompt to extract structured profile from raw resume text
- POST `/api/resume/parse` — accepts multipart file (PDF/.docx, max 5MB), extracts text via `pdf-parse`/`mammoth`, calls GPT-4o, returns `{ profile, raw_text }`
- `src/types/profile.ts` — shared `ParsedProfile`, `Skill`, `WorkExperience`, `Education` types
- `src/components/ResumeUpload.tsx` — drag-and-drop + click upload, client-side validation
- `src/components/ProfileCard.tsx` — view + field-level edit mode for all profile sections; saves to Supabase `candidate_profiles`
- `src/app/page.tsx` — Resume section added above JD scorer

**Supabase table required:**
```sql
create table candidate_profiles (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  raw_text text not null,
  parsed_profile jsonb not null,
  created_at timestamptz default now() not null
);
```
`user_id` is nullable until auth is added.

### Day 2 continued — JD ingestion
- `prompts/jd-parse.md` — GPT-4o prompt to extract structured JD (title, company, seniority, must-haves, nice-to-haves, impact_metrics, etc.)
- POST `/api/jd/parse` — accepts `{ jd_text }`, calls GPT-4o, returns `ParsedJD`
- `src/types/jd.ts` — `ParsedJD` type
- `src/components/JDCard.tsx` — structured JD summary card (seniority badge, must-haves, nice-to-haves, impact metrics)

### Day 3 — Scoring architecture refactor (complete)

**Deleted:** `prompts/fit-score.md`

**New prompts:**
- `prompts/jd-analysis.md` — deep JD analyst: dynamic category weights (C1–C9, sum=100), knowledge half-life (<2yr|2-5yr|5-10yr|10+yr), dimension weights (depth/recency/context), mandatory gates, company context with brand tier
- `prompts/cv-analysis.md` — CV quality analyst: credibility signals, evidence inventory, institution tier, degree difficulty, career trajectory, cv_gaps, strengthening_suggestions
- `prompts/match-scoring.md` — three-input scorer using jd_analysis + cv_analysis + candidate_profile; 9-step process; evidence credibility multipliers; mandatory gate cap (score ≤ 35 if gate failed); tailoring_priorities; candidate_inputs_needed

**New files:**
- `src/lib/hash.ts` — `hashText(text)` using Node.js crypto sha256
- `src/app/api/jd/analyse/route.ts` — POST `{ jd_text }`, caches result in `jd_analysis_cache` (7-day TTL), caches company context in `company_context_cache` (28-day TTL)
- `src/app/api/cv/analyse/route.ts` — POST `{ candidate_profile }`, returns cv_analysis
- `src/components/ScoreResult.tsx` — rich score display: confidence badges, expandable score_breakdown, mandatory gate failures (red), tailoring_priorities, candidate_inputs_needed, cannot_assess_from_cv

**Rewritten:**
- `src/app/api/score/route.ts` — three-case unified handler:
  - `{ jd_text }` only → `response_type: 'jd_only'`
  - `{ candidate_profile }` only → `response_type: 'cv_only'`
  - both → `response_type: 'match'` (Promise.all jd+cv analysis, then match-scoring)
- `src/app/page.tsx` — uses new score route shape; renders `ScoreResult` for match results

**Supabase tables required:**
```sql
create table jd_analysis_cache (
  jd_hash text primary key,
  analysis jsonb not null,
  expires_at timestamptz not null
);

create table company_context_cache (
  company_name text primary key,
  context jsonb not null,
  expires_at timestamptz not null
);
```

### Day 3 continued — Resume tailoring

**New prompts:**
- `prompts/resume-tailor.md` — five-input tailoring engine: rewrites experience bullets, skills, and professional summary using tier-appropriate tone register and domain vocabulary; produces gap_questions and pre_apply_flags
- `prompts/resume-validate.md` — fabrication auditor: checks every tailored bullet against original profile; outputs `{ passed, fabrications_found, warnings, checked_bullets_count }`

**New routes:**
- `POST /api/resume/tailor` — accepts `{ candidate_profile, jd_analysis, cv_analysis, match_scoring, candidate_supplied_context? }`, validates all four required inputs, calls GPT-4o with resume-tailor.md, returns tailored output. Daily cap of 5/user/day (skipped while user_id is null)
- `POST /api/resume/validate` — accepts `{ original_profile, tailored_output }`, calls GPT-4o with resume-validate.md, returns validation result

**New component:**
- `src/components/TailoredResumeView.tsx` — renders full tailoring output: validation banner (green/red), fabrication details, pre-apply flags (blocking red / advisory yellow), tailoring summary, side-by-side original/tailored experience with change tags and inline quantification prompt inputs, tailored skills (prioritised/deprioritised), professional summary before/after, gap questions form with re-tailor callback, Save + Download PDF (stubbed) buttons

**Updated:**
- `src/app/page.tsx` — "Tailor My Resume" / "Re-tailor Resume" button after match score; calls tailor then validate sequentially; renders TailoredResumeView; gap question answers fed back via onReTailor callback

**Supabase table required:**
```sql
create table tailored_resumes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid,
  candidate_profile_id uuid references candidate_profiles(id),
  jd_hash text,
  tailored_output jsonb not null,
  validation_result jsonb not null,
  candidate_supplied_context jsonb,
  created_at timestamptz default now() not null
);
```

**Note:** PDF download button is stubbed (disabled) — to be wired in next task.

## What's next

### Day 4
- PDF generation for tailored resume
- Auth with Supabase (email magic-link)
- Persist scores + JDs to Supabase
- History page — list past scores for logged-in user

## Session Log

### 1 May 2026

**What's built:**
- Three-call scoring architecture live: `/api/jd/analyse`, `/api/cv/analyse`, `/api/score`
- Resume tailoring flow: `/api/resume/tailor`, `/api/resume/validate`
- `TailoredResumeView` component with side-by-side bullets, gap questions, pre-apply flags
- Evals suite at `/evals/` — runs against localhost dev server via fetch
- Supabase tables: `jd_analysis_cache`, `company_context_cache`, `tailored_resumes`
- Prompts: `jd-analysis.md`, `cv-analysis.md`, `match-scoring.md`, `resume-tailor.md`, `resume-validate.md`

**Model swap pending** — all routes currently on GPT-4o, to be replaced:
- Extraction (resume parse, JD parse, CV analysis, validator): Gemini 2.5 Flash-Lite
- Match scoring: Gemini 2.5 Pro
- Resume tailoring + cover letter: Claude Sonnet 4.6
- Requires: `GOOGLE_API_KEY` + `ANTHROPIC_API_KEY` in `.env.local`

**Model swap complete (2 May 2026):**
- Extraction routes (parse, jd/analyse, cv/analyse, validate): `gpt-5-nano` via `EXTRACTION_MODEL` constant in `src/lib/openai.ts`
- Match scoring + resume tailoring: `claude-sonnet-4-6` via `src/lib/anthropic.ts`
- Both Claude routes have try-catch — always return valid JSON, never crash the server
- JD analysis prompt read per-request (inside handler) to prevent stale-prompt cache hits in dev

**Evals current state:** 5/5 passing. Run with `npx ts-node evals/run-evals.ts` (dev server must be running on `:3000`)

**Next session:**
- Cover letter prompt + route
- Auth with Supabase (email magic-link) + usage cap wired to real user_id
- PDF generation for tailored resume
- Persist scores + JDs to Supabase; history page

---

## Conventions

- `src/` directory with `@/*` import alias
- Env vars accessed via `process.env` (never hard-coded)
- API routes live in `src/app/api/`
- Shared clients in `src/lib/`
- Prompts as Markdown files in `/prompts`
- Extraction calls: OpenAI `gpt-5-nano` with `response_format: { type: 'json_object' }`
- Scoring/tailoring calls: Anthropic `claude-sonnet-4-6` via `anthropic.messages.create`
- JD analysis results cached in Supabase by `sha256(jd_text) + '_p' + sha256(prompt)[0:8]`

---

## Token Efficiency Rules

- Never use Claude Code (CC) for file creation, boilerplate, or eval suite generation — use free LLM (ChatGPT free / Gemini free) with a well-written prompt instead
- Claude Code (CC) is only for: complex multi-file debugging, TypeScript errors, environment issues, tasks requiring codebase context
- Build Engine (claude.ai) is for: architecture, prompts, decisions, reviews
- Free LLMs are for: generating test data, boilerplate files, JSON fixtures, eval case templates, documentation drafts
- Before giving any task to CC or Build Engine, ask: can a free LLM do this with a good prompt? If yes, write the prompt and use that instead
- One formal CC checkpoint per build session — batch all CC tasks together rather than one at a time