# job-agent

## What's built

- Next.js 14 app with TypeScript, Tailwind CSS, ESLint, App Router
- Supabase client (`src/lib/supabase.ts`)
- OpenAI client (`src/lib/openai.ts`)
- POST `/api/score` route — accepts `{ jd: string }`, returns `{ score: number, reasoning: string }`
- Home page with textarea for JD input and score display

## What's next

- Wire OpenAI scoring logic into `/api/score` using the `fit-score.md` prompt
- Persist scores to Supabase
- Auth with Supabase (user sessions)
- Job listing UI and history page

## Conventions

- `src/` directory with `@/*` import alias
- Env vars accessed via `process.env` (never hard-coded)
- API routes live in `src/app/api/`
- Shared clients in `src/lib/`
- Prompts as Markdown files in `/prompts`
