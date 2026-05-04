import { NextRequest, NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';
import { anthropic } from '@/lib/anthropic';

export const maxDuration = 60;

const prompt = readFileSync(
  join(process.cwd(), 'prompts', 'cover-letter.md'),
  'utf-8'
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { candidate_profile, jd_analysis, tailored_output } = body;

    if (!candidate_profile || !jd_analysis || !tailored_output) {
      return NextResponse.json(
        { error: 'Missing required inputs: candidate_profile, jd_analysis, tailored_output' },
        { status: 400 }
      );
    }

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: prompt,
      messages: [
        {
          role: 'user',
          content: JSON.stringify({ candidate_profile, jd_analysis, tailored_output })
        }
      ]
    });

    const text = response.content
      .filter((block) => block.type === 'text')
      .map((block) => (block.type === 'text' ? block.text : ''))
      .join('')
      .replace(/```[a-z]*\n?/g, '')
      .trim();

    return NextResponse.json({ cover_letter: text });
  } catch (error) {
    console.error('Cover letter error:', error);
    return NextResponse.json(
      { error: 'Cover letter generation failed' },
      { status: 500 }
    );
  }
}