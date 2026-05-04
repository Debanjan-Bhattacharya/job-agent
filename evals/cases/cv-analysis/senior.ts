import { loadFixture } from '../../lib/fixtures';
import type { TestCase } from '../../lib/runner';

export const testCase: TestCase = {
  id: 'cv-analysis-senior',
  description: 'Marcus healthtech CV — senior tier, high confidence, brand-tier employers present',
  pipeline: 'cv-analysis',
  input: { candidate_profile: loadFixture('cvs/senior-healthtech-usa.json') },
  assertions: [
    { type: 'field_equals', path: 'experience_tier', expected: 'senior' },
    { type: 'field_equals', path: 'cv_confidence', expected: 'high' }
  ],
};
