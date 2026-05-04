import { NextRequest, NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';
import { anthropic } from '@/lib/anthropic';
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

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 16384,
      system: [
        {
          type: "text",
          text: prompt,
          cache_control: { type: "ephemeral" }
        }
      ],
      messages: [
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

    console.log('Anthropic response:', JSON.stringify(message, null, 2));
    const block = message.content[0];
    const raw = block?.type === 'text' ? block.text : '{}';
    const jsonText = raw.replace(/^```(?:json)?\s*/m, '').replace(/\s*```\s*$/m, '').trim() || '{}';
    const tailored_output = JSON.parse(jsonText);
    return NextResponse.json(tailored_output);
  } catch (err) {
    console.error('Tailoring error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Tailoring failed' },
      { status: 500 },
    );
  }
}
