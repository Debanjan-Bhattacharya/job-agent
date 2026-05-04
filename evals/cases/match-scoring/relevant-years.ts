import { loadFixture } from '../../lib/fixtures';
import type { TestCase } from '../../lib/runner';

export const testCase: TestCase = {
  id: 'match-relevant-years-debanjan',
  description: 'Debanjan CV — relevant PM years should be under 7, excluding TCS QA',
  pipeline: 'match-scoring',
  input: {
    jd_text: loadFixture('jds/spinny-pm.txt'),
    candidate_profile: loadFixture('cvs/debanjan.json'),
  },
  assertions: [
    { type: 'field_in_range', path: 'relevant_years_experience', min: 4, max: 6 },
  ],
};
