import { NextRequest, NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';
import { openai } from '@/lib/openai';
import { supabase } from '@/lib/supabase';
import { hashText } from '@/lib/hash';

export const maxDuration = 60;

const jdAnalysisPrompt = readFileSync(
  join(process.cwd(), 'prompts', 'jd-analysis.md'),
  'utf-8',
);

const CACHE_TTL_HOURS = 24 * 30; // 30 days

export async function POST(req: NextRequest) {
  const { jd_text } = (await req.json()) as { jd_text: string };
  if (!jd_text || typeof jd_text !== 'string') {
    return NextResponse.json({ error: 'jd_text is required' }, { status: 400 });
  }

  const jd_hash = hashText(jd_text);

  // Check jd_analysis_cache
  const { data: cached } = await supabase
    .from('jd_analysis_cache')
    .select('analysis')
    .eq('jd_hash', jd_hash)
    .gt('expires_at', new Date().toISOString())
    .single();

  if (cached?.analysis) {
    return NextResponse.json(cached.analysis);
  }

  // Check company_context_cache using a simple heuristic extraction
  let companyContext: unknown = null;
  const companyMatch = jd_text.match(
    /(?:at|join|about)\s+([A-Z][a-zA-Z0-9\s&.,]{2,60}?)(?:\s*[-–|,]|\s+is\s|\s+are\s|\n)/,
  );
  if (companyMatch) {
    const companyName = companyMatch[1].trim().toLowerCase();
    const { data: cachedCompany } = await supabase
      .from('company_context_cache')
      .select('context')
      .eq('company_name', companyName)
      .gt('expires_at', new Date().toISOString())
      .single();
    if (cachedCompany?.context) {
      companyContext = cachedCompany.context;
    }
  }

  const userContent = companyContext
    ? `JOB DESCRIPTION:\n${jd_text}\n\nCOMPANY CONTEXT:\n${JSON.stringify(companyContext, null, 2)}`
    : `JOB DESCRIPTION:\n${jd_text}`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: jdAnalysisPrompt },
      { role: 'user', content: userContent },
    ],
  });

  const analysis = JSON.parse(completion.choices[0].message.content ?? '{}');

  // Write jd_analysis_cache
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + CACHE_TTL_HOURS);
  await supabase.from('jd_analysis_cache').upsert({
    jd_hash,
    analysis,
    expires_at: expiresAt.toISOString(),
  });

  // Write company_context_cache from the analysis result
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

  return NextResponse.json(analysis);
}
