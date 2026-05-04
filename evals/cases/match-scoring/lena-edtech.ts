import { loadFixture } from '../../lib/fixtures';
import type { TestCase } from '../../lib/runner';

export const testCase: TestCase = {
  id: 'match-lena-edtech',
  description: 'Lena B2B marketing CV vs academic counsellor JD — domain mismatch, score 35-55',
  pipeline: 'match-scoring',
  input: {
    jd_text: loadFixture('jds/academic-counsellor-edtech.txt'),
    candidate_profile: loadFixture('cvs/mid-marketing-germany.json'),
  },
  assertions: [
    { type: 'field_in_range', path: 'overall_score', min: 35, max: 55 },
    { type: 'array_not_empty', path: 'tailoring_priorities' },
  ],
};
