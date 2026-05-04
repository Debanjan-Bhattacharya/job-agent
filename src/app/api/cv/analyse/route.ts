import { NextRequest, NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';
import { openai, EXTRACTION_MODEL } from '@/lib/openai';
import { supabase } from '@/lib/supabase';
import { hashText } from '@/lib/hash';

export const maxDuration = 60;

const CACHE_TTL_HOURS = 24 * 7;

export async function POST(req: NextRequest) {
  const { candidate_profile } = (await req.json()) as { candidate_profile: unknown };
  if (!candidate_profile) {
    return NextResponse.json({ error: 'candidate_profile is required' }, { status: 400 });
  }

  const cvAnalysisPrompt = readFileSync(
    join(process.cwd(), 'prompts', 'cv-analysis.md'),
    'utf-8',
  );

  const cv_hash =
    hashText(JSON.stringify(candidate_profile)) + '_p' + hashText(cvAnalysisPrompt).slice(0, 8);

  const { data: cached } = await supabase
    .from('cv_analysis_cache')
    .select('analysis')
    .eq('cv_hash', cv_hash)
    .gt('expires_at', new Date().toISOString())
    .single();

  if (cached?.analysis) {
    return NextResponse.json(cached.analysis);
  }

  const completion = await openai.chat.completions.create({
    model: EXTRACTION_MODEL,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: cvAnalysisPrompt },
      {
        role: 'user',
        content: `CANDIDATE PROFILE:\n${JSON.stringify(candidate_profile, null, 2)}`,
      },
    ],
  });

  const analysis = JSON.parse(completion.choices[0].message.content ?? '{}') as Record<
    string,
    unknown
  >;

  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + CACHE_TTL_HOURS);
  await supabase.from('cv_analysis_cache').upsert({
    cv_hash,
    analysis,
    expires_at: expiresAt.toISOString(),
  });

  return NextResponse.json(analysis);
}
