import { loadFixture } from '../../lib/fixtures';
import type { TestCase } from '../../lib/runner';

export const testCase: TestCase = {
  id: 'match-overqualified-spinny',
  description: 'Senior VP applying for mid PM role — should flag overqualification',
  pipeline: 'match-scoring',
  input: {
    jd_text: loadFixture('jds/spinny-pm.txt'),
    candidate_profile: loadFixture('cvs/overqualified.json'),
  },
  assertions: [
    { type: 'field_equals', path: 'experience_tier', expected: 'senior' },
    { type: 'field_in_range', path: 'overall_score', min: 30, max: 60 },
    { type: 'string_not_contains', path: 'score_breakdown.C5_seniority_scope.reasoning', forbidden: 'no overqualification' },
  ],
};
