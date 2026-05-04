import { loadFixture } from '../../lib/fixtures';
import type { TestCase } from '../../lib/runner';

export const testCase: TestCase = {
  id: 'match-carlos-autosales',
  description: 'Carlos automotive sales CV vs area sales manager JD — solid match, no gate cap',
  pipeline: 'match-scoring',
  input: {
    jd_text: loadFixture('jds/area-sales-manager-auto.txt'),
    candidate_profile: loadFixture('cvs/mid-senior-sales-mexico.json'),
  },
  assertions: [
    { type: 'field_in_range', path: 'overall_score', min: 55, max: 75 },
    { type: 'field_equals', path: 'mandatory_gate_cap_applied', expected: false },
  ],
};
