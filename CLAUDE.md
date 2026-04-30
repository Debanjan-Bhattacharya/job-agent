# job-agent

## What's built

### Day 1 — complete
- Next.js 14 app with TypeScript, Tailwind CSS, ESLint, App Router
- Supabase client (`src/lib/supabase.ts`)
- OpenAI client (`src/lib/openai.ts`)
- POST `/api/score` route — accepts `{ jd: string, candidate?: object }`, calls GPT-4o with `prompts/fit-score.md` as system prompt, returns scored JSON
- `prompts/fit-score.md` — full fit-scoring prompt with 4 experience tiers, 5+1 conditional dimensions, weighted overall score
- Home page with JD textarea and scored result display
- Deployed: https://job-agent-nine-rho.vercel.app

### Day 2 — complete
- `prompts/resume-parse.md` — GPT-4o prompt to extract structured profile from raw resume text
- POST `/api/resume/parse` — accepts multipart file (PDF/.docx, max 5MB), extracts text via `pdf-parse`/`mammoth`, calls GPT-4o, returns `{ profile, raw_text }`
- `src/types/profile.ts` — shared `ParsedProfile`, `Skill`, `WorkExperience`, `Education` types
- `src/components/ResumeUpload.tsx` — drag-and-drop + click upload, client-side validation
- `src/components/ProfileCard.tsx` — view + field-level edit mode for all profile sections; saves to Supabase `candidate_profiles`
- `src/app/page.tsx` — Resume section added above JD scorer; parsed profile auto-wired into score call

**Supabase table required** — run in dashboard SQL editor:
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

## What's next

### Day 3
- Auth with Supabase (email magic-link)
- Persist scores to Supabase `job_scores` table
- History page — list past scores for logged-in user

## Conventions

- `src/` directory with `@/*` import alias
- Env vars accessed via `process.env` (never hard-coded)
- API routes live in `src/app/api/`
- Shared clients in `src/lib/`
- Prompts as Markdown files in `/prompts`
