import _ from 'lodash';
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { type Assertion, type AssertionResult, runAssertion } from './assertions';

export interface TestCase {
  id: string;
  description: string;
  pipeline: string;
  input: Record<string, unknown>;
  assertions: Assertion[];
}

export interface AssertionOutcome {
  assertion: Assertion;
  result: AssertionResult;
}

export interface CaseResult {
  testCase: TestCase;
  passed: boolean;
  assertionOutcomes: AssertionOutcome[];
  durationMs: number;
  error?: string;
}

export interface PipelineResult {
  pipeline: string;
  cases: CaseResult[];
  passed: number;
  failed: number;
  total: number;
}

export type CallFn = (input: Record<string, unknown>) => Promise<Record<string, unknown>>;

export async function runCase(testCase: TestCase, callFn: CallFn): Promise<CaseResult> {
  const start = Date.now();

  let data: Record<string, unknown> = {};
  let error: string | undefined;

  try {
    data = await callFn(testCase.input);
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
    return {
      testCase,
      passed: false,
      assertionOutcomes: [],
      durationMs: Date.now() - start,
      error,
    };
  }

  const assertionOutcomes: AssertionOutcome[] = [];

  for (const assertion of testCase.assertions) {
    if (assertion.type === 'score_consistency') {
      // Run callFn the remaining (runs - 1) times and collect scores
      const scores: number[] = [_.get(data, assertion.scorePath) as number];
      for (let i = 1; i < assertion.runs; i++) {
        try {
          const extra = await callFn(testCase.input);
          scores.push(_.get(extra, assertion.scorePath) as number);
        } catch (e) {
          scores.push(NaN);
        }
      }
      const validScores = scores.filter((s) => !isNaN(s));
      const variance =
        validScores.length > 0 ? Math.max(...validScores) - Math.min(...validScores) : Infinity;
      const passed = validScores.length === assertion.runs && variance <= assertion.maxVariance;
      assertionOutcomes.push({
        assertion,
        result: {
          passed,
          message: passed
            ? `✓ score_consistency: scores=[${scores.join(', ')}], variance=${variance} ≤ ${assertion.maxVariance}`
            : `✗ score_consistency: scores=[${scores.join(', ')}], variance=${variance} > ${assertion.maxVariance}`,
        },
      });
    } else {
      assertionOutcomes.push({
        assertion,
        result: runAssertion(assertion, data),
      });
    }
  }

  return {
    testCase,
    passed: assertionOutcomes.every((o) => o.result.passed),
    assertionOutcomes,
    durationMs: Date.now() - start,
    error,
  };
}

export async function runPipeline(cases: TestCase[], callFn: CallFn): Promise<PipelineResult> {
  const results: CaseResult[] = [];
  for (const tc of cases) {
    results.push(await runCase(tc, callFn));
  }
  const passed = results.filter((r) => r.passed).length;
  return {
    pipeline: cases[0]?.pipeline ?? 'unknown',
    cases: results,
    passed,
    failed: results.length - passed,
    total: results.length,
  };
}

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';

export function printResults(results: CaseResult[]): void {
  const failed = results.filter((r) => !r.passed);
  if (failed.length === 0) {
    console.log('');
    return;
  }
  console.log(`\n${BOLD}${RED}FAILED CASES${RESET}`);
  for (const r of failed) {
    console.log(`\n${BOLD}[${RED}FAIL${RESET}${BOLD}]${RESET} ${r.testCase.id} — ${r.testCase.description} ${DIM}(${r.durationMs}ms)${RESET}`);
    if (r.error) {
      console.log(`  ${RED}Error: ${r.error}${RESET}`);
    }
    for (const o of r.assertionOutcomes) {
      if (!o.result.passed) {
        console.log(`  ${RED}${o.result.message}${RESET}`);
      }
    }
  }
  console.log('');
}

export function writeSummaryJson(results: CaseResult[]): void {
  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = total - passed;
  const passRate = total > 0 ? `${((passed / total) * 100).toFixed(1)}%` : '0.0%';

  const failedCases = results
    .filter((r) => !r.passed)
    .map((r) => ({
      id: r.testCase.id,
      description: r.testCase.description,
      failed_assertions: r.error
        ? [`Error: ${r.error}`]
        : r.assertionOutcomes
            .filter((o) => !o.result.passed)
            .map((o) => o.result.message),
    }));

  const summary = {
    run_date: new Date().toISOString(),
    total_cases: total,
    passed,
    failed,
    pass_rate: passRate,
    failed_cases: failedCases,
  };

  const resultsDir = join(__dirname, '..', 'results');
  mkdirSync(resultsDir, { recursive: true });
  writeFileSync(join(resultsDir, 'summary.json'), JSON.stringify(summary, null, 2));
}

export function printSummaryTable(allResults: CaseResult[]): void {
  const total = allResults.length;
  const passed = allResults.filter((r) => r.passed).length;
  const failed = total - passed;
  const rate = total > 0 ? ((passed / total) * 100).toFixed(1) : '0.0';

  console.log(`${BOLD}${'─'.repeat(50)}${RESET}`);
  console.log(`${BOLD}EVAL SUMMARY${RESET}`);
  console.log(`${'─'.repeat(50)}`);
  console.log(`  Total cases : ${total}`);
  console.log(`  Passed      : ${GREEN}${passed}${RESET}`);
  console.log(`  Failed      : ${failed > 0 ? RED : ''}${failed}${RESET}`);
  console.log(`  Pass rate   : ${passed === total ? GREEN : YELLOW}${rate}%${RESET}`);
  console.log(`${'─'.repeat(50)}`);
}
