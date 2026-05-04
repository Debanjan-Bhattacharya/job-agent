import { loadFixture } from '../../lib/fixtures';
import type { TestCase } from '../../lib/runner';

export const testCase: TestCase = {
  id: 'match-tomasz-facility',
  description: 'Supply chain profile vs Facility Manager JD — adjacent domain, score 40-65',
  pipeline: 'match-scoring',
  input: {
    jd_text: loadFixture('jds/facility-manager-jll.txt'),
    candidate_profile: loadFixture('cvs/mid-senior-supplychain-poland.json'),
  },
  assertions: [
    { type: 'field_in_range', path: 'overall_score', min: 40, max: 65 },
    { type: 'field_equals', path: 'mandatory_gate_cap_applied', expected: false },
    { type: 'field_equals', path: 'experience_tier', expected: 'mid-senior' },
  ],
};
