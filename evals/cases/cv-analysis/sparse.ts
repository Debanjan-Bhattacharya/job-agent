import { loadFixture } from '../../lib/fixtures';
import type { TestCase } from '../../lib/runner';

export const testCase: TestCase = {
  id: 'cv-analysis-sparse',
  description: 'Sparse CV — low confidence, gaps present, unclear career trajectory',
  pipeline: 'cv-analysis',
  input: { candidate_profile: loadFixture('cvs/sparse-cv.json') },
  assertions: [
    { type: 'field_equals', path: 'cv_confidence', expected: 'low' },
    { type: 'array_not_empty', path: 'cv_gaps' },
    { type: 'field_equals', path: 'experience_summary.career_trajectory', expected: 'unclear' },
  ],
};
