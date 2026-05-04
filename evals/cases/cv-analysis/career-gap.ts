import { loadFixture } from '../../lib/fixtures';
import type { TestCase } from '../../lib/runner';

export const testCase: TestCase = {
  id: 'cv-analysis-career-gap',
  description: 'Finance career switcher — 18 month gap between roles should be detected',
  pipeline: 'cv-analysis',
  input: {
    candidate_profile: loadFixture('cvs/mid-finance-india.json'),
  },
  assertions: [
    { type: 'field_equals', path: 'experience_summary.career_break_detected', expected: true },
  ],
};
