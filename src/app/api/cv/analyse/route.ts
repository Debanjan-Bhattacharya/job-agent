import { NextRequest, NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';
import { openai } from '@/lib/openai';

export const maxDuration = 60;

const cvAnalysisPrompt = readFileSync(
  join(process.cwd(), 'prompts', 'cv-analysis.md'),
  'utf-8',
);

export async function POST(req: NextRequest) {
  const { candidate_profile } = (await req.json()) as { candidate_profile: unknown };
  if (!candidate_profile) {
    return NextResponse.json({ error: 'candidate_profile is required' }, { status: 400 });
  }

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: cvAnalysisPrompt },
      {
        role: 'user',
        content: `CANDIDATE PROFILE:\n${JSON.stringify(candidate_profile, null, 2)}`,
      },
    ],
  });

  const analysis = JSON.parse(completion.choices[0].message.content ?? '{}');
  return NextResponse.json(analysis);
}
