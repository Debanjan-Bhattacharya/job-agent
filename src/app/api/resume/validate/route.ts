import { NextRequest, NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';
import { openai, EXTRACTION_MODEL } from '@/lib/openai';

const validatePrompt = readFileSync(
  join(process.cwd(), 'prompts', 'resume-validate.md'),
  'utf-8',
);

export async function POST(req: NextRequest) {
  const body = (await req.json()) as {
    original_profile?: unknown;
    tailored_output?: unknown;
  };

  const { original_profile, tailored_output } = body;

  if (!original_profile || !tailored_output) {
    return NextResponse.json(
      { error: 'original_profile and tailored_output are required' },
      { status: 400 },
    );
  }

  const completion = await openai.chat.completions.create({
    model: EXTRACTION_MODEL,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: validatePrompt },
      {
        role: 'user',
        content: JSON.stringify({ original_profile, tailored_output }, null, 2),
      },
    ],
  });

  const result = JSON.parse(completion.choices[0].message.content ?? '{}');
  return NextResponse.json(result);
}
