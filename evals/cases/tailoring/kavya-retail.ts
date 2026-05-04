import { loadFixture } from '../../lib/fixtures';
import type { TestCase } from '../../lib/runner';

export const testCase: TestCase = {
  id: 'tailor-kavya-retail',
  description: 'Tailor Kavya CV for Forest Essentials SM — bullets present, no Spinny in summary, flags raised',
  pipeline: 'tailoring',
  input: {
    jd_text: loadFixture('jds/retail-store-manager-forest-essentials.txt'),
    candidate_profile: loadFixture('cvs/non-tech.json'),
  },
  assertions: [
    { type: 'array_not_empty', path: 'tailored_experience[0].tailored_bullets' },
    { type: 'string_not_contains', path: 'tailored_summary.tailored', forbidden: 'Spinny' },
    { type: 'array_not_empty', path: 'pre_apply_flags' },
  ],
};
