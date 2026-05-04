import { loadFixture } from '../../lib/fixtures';
import type { TestCase } from '../../lib/runner';

export const testCase: TestCase = {
  id: 'match-grad-spinny',
  description: 'Fresh grad CV vs Spinny PM — should score low, tier grad, no gate cap',
  pipeline: 'match-scoring',
  input: {
    jd_text: loadFixture('jds/spinny-pm.txt'),
    candidate_profile: loadFixture('cvs/fresh-grad.json'),
  },
  assertions: [
    { type: 'field_equals', path: 'experience_tier', expected: 'grad' },
    { type: 'field_in_range', path: 'overall_score', min: 20, max: 45 },
    { type: 'field_equals', path: 'mandatory_gate_cap_applied', expected: false },
  ],
};
