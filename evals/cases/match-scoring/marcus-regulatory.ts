import { loadFixture } from '../../lib/fixtures';
import type { TestCase } from '../../lib/runner';

export const testCase: TestCase = {
  id: 'match-marcus-regulatory',
  description: 'Marcus VP RA vs mid-level RA Manager JD — overqualified, score 40-65, senior tier',
  pipeline: 'match-scoring',
  input: {
    jd_text: loadFixture('jds/regulatory-affairs-meddevice.txt'),
    candidate_profile: loadFixture('cvs/senior-healthtech-usa.json'),
  },
  assertions: [
    { type: 'field_in_range', path: 'overall_score', min: 40, max: 65 },
    { type: 'field_equals', path: 'experience_tier', expected: 'senior' },
    { type: 'string_not_contains', path: 'score_breakdown.C5_seniority_scope.reasoning', forbidden: 'no overqualification' },
  ],
};
