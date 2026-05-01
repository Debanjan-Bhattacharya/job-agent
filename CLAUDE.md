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

## What's next

### Day 4
- Auth with Supabase (email magic-link)
- Persist scores + JDs to Supabase
- History page — list past scores for logged-in user

## Conventions

- `src/` directory with `@/*` import alias
- Env vars accessed via `process.env` (never hard-coded)
- API routes live in `src/app/api/`
- Shared clients in `src/lib/`
- Prompts as Markdown files in `/prompts`
- All LLM calls use `model: 'gpt-4o'` with `response_format: { type: 'json_object' }`
- JD analysis results cached in Supabase by sha256 hash of JD text
