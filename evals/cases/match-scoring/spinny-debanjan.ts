import { loadFixture } from '../../lib/fixtures';
import type { TestCase } from '../../lib/runner';

export const testCase: TestCase = {
  id: 'match-spinny-debanjan',
  description: 'Debanjan CV vs Spinny PM — should score 60-75, no mandatory gate cap',
  pipeline: 'match-scoring',
  input: {
    jd_text: loadFixture('jds/spinny-pm.txt'),
    candidate_profile: loadFixture('cvs/debanjan.json'),
  },
  assertions: [
    { type: 'field_in_range', path: 'overall_score', min: 55, max: 75 },
    { type: 'field_equals', path: 'mandatory_gate_cap_applied', expected: false },
    { type: 'array_empty', path: 'mandatory_gates.failed' },
    { type: 'object_not_empty', path: 'score_breakdown' }
   ]
};
