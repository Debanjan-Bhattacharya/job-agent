import { loadFixture } from '../../lib/fixtures';
import type { TestCase } from '../../lib/runner';

export const testCase: TestCase = {
  id: 'match-kavya-retail',
  description: 'Kavya retail CV vs Forest Essentials SM JD — strong match, no gate cap, culture fit present',
  pipeline: 'match-scoring',
  input: {
    jd_text: loadFixture('jds/retail-store-manager-forest-essentials.txt'),
    candidate_profile: loadFixture('cvs/non-tech.json'),
  },
  assertions: [
    { type: 'field_in_range', path: 'overall_score', min: 65, max: 85 },
    { type: 'field_equals', path: 'mandatory_gate_cap_applied', expected: false },
    { type: 'object_not_empty', path: 'score_breakdown.C8_culture_fit' },
  ],
};
