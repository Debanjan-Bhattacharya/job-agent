import { NextRequest, NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';
import { openai } from '@/lib/openai';
import { supabase } from '@/lib/supabase';

export const maxDuration = 60;

const tailorPrompt = readFileSync(
  join(process.cwd(), 'prompts', 'resume-tailor.md'),
  'utf-8',
);

export async function POST(req: NextRequest) {
  const body = (await req.json()) as {
    candidate_profile?: unknown;
    jd_analysis?: unknown;
    cv_analysis?: unknown;
    match_scoring?: unknown;
    candidate_supplied_context?: Record<string, string>;
  };

  const { candidate_profile, jd_analysis, cv_analysis, match_scoring, candidate_supplied_context } =
    body;

  if (!candidate_profile || !jd_analysis || !cv_analysis || !match_scoring) {
    return NextResponse.json(
      {
        error:
          'candidate_profile, jd_analysis, cv_analysis, and match_scoring are all required',
      },
      { status: 400 },
    );
  }

  // Daily usage cap — skipped while user_id is null (no auth yet)
  const userId: string | null = null; // replace with auth session user ID when auth is added
  if (userId !== null) {
    const { count } = await supabase
      .from('tailored_resumes')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
    if ((count ?? 0) >= 5) {
      return NextResponse.json(
        { error: 'Daily limit of 5 tailored resumes reached. Try again tomorrow.' },
        { status: 429 },
      );
    }
  }

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: tailorPrompt },
      {
        role: 'user',
        content: JSON.stringify(
          {
            candidate_profile,
            jd_analysis,
            cv_analysis,
            match_scoring,
            candidate_supplied_context: candidate_supplied_context ?? {},
          },
          null,
          2,
        ),
      },
    ],
  });

  const tailored_output = JSON.parse(completion.choices[0].message.content ?? '{}');
  return NextResponse.json(tailored_output);
}
