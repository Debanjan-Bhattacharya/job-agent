/**
 * Evals runner.
 *
 * Usage:
 *   npx ts-node -r tsconfig-paths/register --project tsconfig.evals.json evals/run-evals.ts
 *   npx ts-node -r tsconfig-paths/register --project tsconfig.evals.json evals/run-evals.ts --pipeline jd-analysis
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { readdirSync, statSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

import {
  type TestCase,
  type CaseResult,
  type CallFn,
  runCase,
  printResults,
  printSummaryTable,
  writeSummaryJson,
} from './lib/runner';

const BASE_URL = 'http://localhost:3000';

const callJdAnalysis: CallFn = async (input) => {
  const res = await fetch(`${BASE_URL}/api/jd/analyse`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return res.json();
};

const callScore: CallFn = async (input) => {
  const res = await fetch(`${BASE_URL}/api/score`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return res.json();
};

const callCvAnalysis: CallFn = async (input) => {
  const res = await fetch(`${BASE_URL}/api/cv/analyse`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return res.json();
};

const callTailor: CallFn = async (input) => {
  const res = await fetch(`${BASE_URL}/api/resume/tailor`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return res.json();
};

// ---------------------------------------------------------------------------
// Pipeline call functions
// ---------------------------------------------------------------------------

const pipelines: Record<string, CallFn> = {
  'jd-analysis': (input) => callJdAnalysis(input),

  'cv-analysis': (input) => callCvAnalysis(input),

  'match-scoring': async (input) => {
    const result = await callScore(input);
    console.log('[match-scoring] raw API response:', JSON.stringify(result, null, 2));
    return result;
  },

  tailoring: async (input) => {
    // Step 1: get jd_analysis, cv_analysis, and match scoring from score route
    const scoreData = await callScore({
      jd_text: input.jd_text,
      candidate_profile: input.candidate_profile,
    }) as {
      jd_analysis: unknown;
      cv_analysis: unknown;
      response_type: string;
      [key: string]: unknown;
    };

    const { jd_analysis, cv_analysis, response_type: _rt, ...matchScoring } = scoreData;

    // Step 2: tailor
    return callTailor({
      candidate_profile: input.candidate_profile,
      jd_analysis,
      cv_analysis,
      match_scoring: matchScoring,
    });
  },
};

// ---------------------------------------------------------------------------
// Dynamic case loader
// ---------------------------------------------------------------------------

function loadCasesFromDir(dir: string): TestCase[] {
  const cases: TestCase[] = [];
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return cases;
  }
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      cases.push(...loadCasesFromDir(fullPath));
    } else if (entry.endsWith('.ts') || entry.endsWith('.js')) {
      // ts-node compiles .ts on the fly via require
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const mod = require(fullPath) as { testCase?: TestCase };
      if (mod.testCase) cases.push(mod.testCase);
    }
  }
  return cases;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  // Parse --pipeline flag
  const pipelineArg = (() => {
    const idx = process.argv.indexOf('--pipeline');
    return idx !== -1 ? process.argv[idx + 1] : undefined;
  })();

  const casesDir = join(__dirname, 'cases');
  let allCases = loadCasesFromDir(casesDir);

  if (pipelineArg) {
    allCases = allCases.filter((c) => c.pipeline === pipelineArg);
    if (allCases.length === 0) {
      console.error(`No cases found for pipeline "${pipelineArg}"`);
      process.exit(1);
    }
    console.log(`Running pipeline: ${pipelineArg} (${allCases.length} case(s))`);
  } else {
    console.log(`Running all pipelines (${allCases.length} case(s))`);
  }

  const allResults: CaseResult[] = [];

  for (const tc of allCases) {
    const callFn = pipelines[tc.pipeline];
    if (!callFn) {
      console.error(`Unknown pipeline "${tc.pipeline}" in case ${tc.id}`);
      allResults.push({
        testCase: tc,
        passed: false,
        assertionOutcomes: [],
        durationMs: 0,
        error: `Unknown pipeline: ${tc.pipeline}`,
      });
      continue;
    }
    console.log(`  Running ${tc.id}…`);
    const result = await runCase(tc, callFn);
    allResults.push(result);
  }

  printResults(allResults);
  printSummaryTable(allResults);
  writeSummaryJson(allResults);

  // Write results to file
  const resultsDir = join(__dirname, 'results');
  mkdirSync(resultsDir, { recursive: true });
  const outputPath = join(resultsDir, 'latest.json');
  writeFileSync(
    outputPath,
    JSON.stringify(
      {
        runAt: new Date().toISOString(),
        pipeline: pipelineArg ?? 'all',
        results: allResults.map((r) => ({
          id: r.testCase.id,
          description: r.testCase.description,
          pipeline: r.testCase.pipeline,
          passed: r.passed,
          durationMs: r.durationMs,
          error: r.error,
          assertions: r.assertionOutcomes.map((o) => ({
            type: o.assertion.type,
            passed: o.result.passed,
            message: o.result.message,
          })),
        })),
        summary: {
          total: allResults.length,
          passed: allResults.filter((r) => r.passed).length,
          failed: allResults.filter((r) => !r.passed).length,
        },
      },
      null,
      2,
    ),
  );
  console.log(`\nResults written to ${outputPath}`);

  const anyFailed = allResults.some((r) => !r.passed);
  process.exit(anyFailed ? 1 : 0);
}

main().catch((err: unknown) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
