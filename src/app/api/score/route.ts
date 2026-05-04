import { NextRequest, NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';
import { openai, EXTRACTION_MODEL } from '@/lib/openai';
import { anthropic } from '@/lib/anthropic';
import { supabase } from '@/lib/supabase';
import { hashText } from '@/lib/hash';

export const maxDuration = 60;

const cvAnalysisPrompt = readFileSync(
  join(process.cwd(), 'prompts', 'cv-analysis.md'),
  'utf-8',
);
const matchScoringPrompt = readFileSync(
  join(process.cwd(), 'prompts', 'match-scoring.md'),
  'utf-8',
);

const CACHE_TTL_HOURS = 24 * 30;

async function getJDAnalysis(jd_text: string): Promise<Record<string, unknown>> {
  const jdAnalysisPrompt = readFileSync(
    join(process.cwd(), 'prompts', 'jd-analysis.md'),
    'utf-8',
  );
  const jd_hash = hashText(jd_text) + '_p' + hashText(jdAnalysisPrompt).slice(0, 8);

  const { data: cached } = await supabase
    .from('jd_analysis_cache')
    .select('analysis')
    .eq('jd_hash', jd_hash)
    .gt('expires_at', new Date().toISOString())
    .single();

  if (cached?.analysis) return cached.analysis as Record<string, unknown>;

  const completion = await openai.chat.completions.create({
    model: EXTRACTION_MODEL,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: jdAnalysisPrompt },
      { role: 'user', content: `JOB DESCRIPTION:\n${jd_text}` },
    ],
  });

  const analysis = JSON.parse(completion.choices[0].message.content ?? '{}') as Record<
    string,
    unknown
  >;

  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + CACHE_TTL_HOURS);
  await supabase.from('jd_analysis_cache').upsert({
    jd_hash,
    analysis,
    expires_at: expiresAt.toISOString(),
  });

  const companyName = (analysis.company_context as Record<string, unknown> | undefined)
    ?.company_name as string | undefined;
  if (companyName) {
    const companyExpiresAt = new Date();
    companyExpiresAt.setHours(companyExpiresAt.getHours() + CACHE_TTL_HOURS * 4);
    await supabase.from('company_context_cache').upsert({
      company_name: companyName.toLowerCase(),
      context: analysis.company_context,
      expires_at: companyExpiresAt.toISOString(),
    });
  }

  return analysis;
}

async function getCVAnalysis(candidate_profile: unknown): Promise<Record<string, unknown>> {
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
  return JSON.parse(completion.choices[0].message.content ?? '{}') as Record<string, unknown>;
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as { jd_text?: string; candidate_profile?: unknown };
  const { jd_text, candidate_profile } = body;

  // Case 1: JD only
  if (jd_text && !candidate_profile) {
    const jd_analysis = await getJDAnalysis(jd_text);
    return NextResponse.json({ response_type: 'jd_only', jd_analysis });
  }

  // Case 2: CV only
  if (!jd_text && candidate_profile) {
    const cv_analysis = await getCVAnalysis(candidate_profile);
    return NextResponse.json({ response_type: 'cv_only', cv_analysis });
  }

  // Case 3: Match
  if (jd_text && candidate_profile) {
    try {
      const [jd_analysis, cv_analysis] = await Promise.all([
        getJDAnalysis(jd_text),
        getCVAnalysis(candidate_profile),
      ]);

      const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 16384,
        system: [
          {
          type: "text",
          text: matchScoringPrompt,
          cache_control: { type: "ephemeral" }
          }
        ],
        messages: [
          {
            role: 'user',
            content: [
              `JD ANALYSIS:\n${JSON.stringify(jd_analysis, null, 2)}`,
              `CV ANALYSIS:\n${JSON.stringify(cv_analysis, null, 2)}`,
              `CANDIDATE PROFILE:\n${JSON.stringify(candidate_profile, null, 2)}`,
            ].join('\n\n'),
          },
        ],
      });

      console.log('Anthropic response:', JSON.stringify(message, null, 2));
      const block = message.content[0];
      const raw = block?.type === 'text' ? block.text : '{}';
      const jsonText = raw.replace(/^```(?:json)?\s*/m, '').replace(/\s*```\s*$/m, '').trim() || '{}';
      const match_score = JSON.parse(jsonText) as Record<string, unknown>;

      if (match_score.mandatory_gate_cap_applied === true && (match_score.overall_score as number) > 35) {
        match_score.overall_score = 35;
      }

      return NextResponse.json({
        response_type: 'match',
        jd_analysis,
        cv_analysis,
        ...match_score,
      });
    } catch (err) {
      console.error('Match scoring error:', err);
      return NextResponse.json(
        { error: err instanceof Error ? err.message : 'Match scoring failed' },
        { status: 500 },
      );
    }
  }

  return NextResponse.json(
    { error: 'Provide jd_text, candidate_profile, or both' },
    { status: 400 },
  );
}
