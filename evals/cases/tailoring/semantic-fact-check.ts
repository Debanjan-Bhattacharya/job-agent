import { loadFixture } from '../../lib/fixtures';
import type { TestCase } from '../../lib/runner';

export const testCase: TestCase = {
  id: 'tailor-semantic-fact-check',
  description: 'TCS bullet — financial should not be changed to operational',
  pipeline: 'tailoring',
  input: {
    jd_text: loadFixture('jds/spinny-pm.txt'),
    candidate_profile: loadFixture('cvs/debanjan.json'),
  },
  assertions: [
    { type: 'array_length_gte', path: 'tailored_experience[2].tailored_bullets', min: 4 },
    { type: 'field_equals', path: 'tailored_experience[2].narrative_anchor_detected', expected: true },
  ],
};
