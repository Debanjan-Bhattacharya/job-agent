import { loadFixture } from '../../lib/fixtures';
import type { TestCase } from '../../lib/runner';

export const testCase: TestCase = {
  id: 'match-career-switcher-spinny',
  description: 'Finance career switcher applying for PM — relevant years should be 0',
  pipeline: 'match-scoring',
  input: {
    jd_text: loadFixture('jds/spinny-pm.txt'),
    candidate_profile: loadFixture('cvs/career-switcher.json'),
  },
  assertions: [
    { type: 'field_in_range', path: 'relevant_years_experience', min: 0, max: 2 },
    { type: 'field_in_range', path: 'overall_score', min: 25, max: 50 },
    { type: 'field_equals', path: 'mandatory_gate_cap_applied', expected: false },
  ],
};
