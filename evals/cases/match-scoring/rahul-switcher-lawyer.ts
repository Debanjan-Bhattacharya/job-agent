import { loadFixture } from '../../lib/fixtures';
import type { TestCase } from '../../lib/runner';

export const testCase: TestCase = {
  id: 'match-rahul-switcher-lawyer',
  description: 'Finance CV vs lawyer JD — LLB mandatory gate fires, score capped at ≤35',
  pipeline: 'match-scoring',
  input: {
    jd_text: loadFixture('jds/lawyer-private.txt'),
    candidate_profile: loadFixture('cvs/mid-finance-india.json'),
  },
  assertions: [
    { type: 'field_equals', path: 'mandatory_gate_cap_applied', expected: true },
    { type: 'field_in_range', path: 'overall_score', min: 0, max: 35 },
  ],
};
