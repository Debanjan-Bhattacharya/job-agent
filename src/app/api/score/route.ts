import { NextRequest, NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';
import { openai } from '@/lib/openai';

const systemPrompt = readFileSync(
  join(process.cwd(), 'prompts', 'fit-score.md'),
  'utf-8'
);

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { jd, candidate } = body as { jd: string; candidate: unknown };

  if (!jd || typeof jd !== 'string') {
    return NextResponse.json({ error: 'jd is required' }, { status: 400 });
  }

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: `CANDIDATE:\n${JSON.stringify(candidate ?? {}, null, 2)}\n\nJOB DESCRIPTION:\n${jd}`,
      },
    ],
  });

  const raw = completion.choices[0].message.content ?? '{}';
  const result = JSON.parse(raw);

  return NextResponse.json(result);
}
