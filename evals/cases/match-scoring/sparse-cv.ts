import { loadFixture } from '../../lib/fixtures';
import type { TestCase } from '../../lib/runner';

export const testCase: TestCase = {
  id: 'match-sparse-cv-spinny',
  description: 'Sparse CV — cv_confidence should be low, score should reflect thin evidence',
  pipeline: 'match-scoring',
  input: {
    jd_text: loadFixture('jds/spinny-pm.txt'),
    candidate_profile: loadFixture('cvs/sparse-cv.json'),
  },
  assertions: [
    { type: 'field_in_range', path: 'overall_score', min: 10, max: 40 },
  ],
};
