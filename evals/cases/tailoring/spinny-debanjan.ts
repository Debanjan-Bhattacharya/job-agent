import { loadFixture } from '../../lib/fixtures';
import type { TestCase } from '../../lib/runner';

export const testCase: TestCase = {
  id: 'tailor-spinny-debanjan',
  description: 'Tailoring Debanjan CV for Spinny — all bullets present, no fabrications',
  pipeline: 'tailoring',
  input: {
    jd_text: loadFixture('jds/spinny-pm.txt'),
    candidate_profile: loadFixture('cvs/debanjan.json'),
  },
  assertions: [
    { type: 'array_length_gte', path: 'tailored_experience[0].tailored_bullets', min: 8 },
    { type: 'array_not_empty', path: 'tailored_experience[0].original_bullets' },
    {
      type: 'field_equals',
      path: 'tailored_experience[0].narrative_anchor_detected',
      expected: true,
    },
    { type: 'string_not_contains', path: 'tailored_summary.tailored', forbidden: 'Spinny' },
    { type: 'array_not_empty', path: 'pre_apply_flags' },
  ],
};
