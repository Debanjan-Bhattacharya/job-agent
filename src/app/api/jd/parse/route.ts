import { NextRequest, NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';
import { openai } from '@/lib/openai';

const systemPrompt = readFileSync(
  join(process.cwd(), 'prompts', 'jd-parse.md'),
  'utf-8'
);

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { jd_text } = body as { jd_text: string };

  if (!jd_text || typeof jd_text !== 'string') {
    return NextResponse.json({ error: 'jd_text is required' }, { status: 400 });
  }

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `JOB DESCRIPTION:\n${jd_text}` },
    ],
  });

  const raw = completion.choices[0].message.content ?? '{}';
  const parsed_jd = JSON.parse(raw);

  return NextResponse.json(parsed_jd);
}
