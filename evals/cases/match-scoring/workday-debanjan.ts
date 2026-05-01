import { loadFixture } from '../../lib/fixtures';
import type { TestCase } from '../../lib/runner';

export const testCase: TestCase = {
  id: 'match-workday-debanjan',
  description: 'Debanjan CV vs Workday JD — mandatory gate should cap score at 35',
  pipeline: 'match-scoring',
  input: {
    jd_text: loadFixture('jds/workday-accounting.txt'),
    candidate_profile: loadFixture('cvs/debanjan.json'),
  },
  assertions: [
    { type: 'field_equals', path: 'mandatory_gate_cap_applied', expected: true },
    { type: 'field_in_range', path: 'overall_score', min: 0, max: 35 },
    { type: 'array_not_empty', path: 'mandatory_gates.failed' },
  ],
};
