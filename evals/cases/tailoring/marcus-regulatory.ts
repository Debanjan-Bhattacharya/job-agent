import { loadFixture } from '../../lib/fixtures';
import type { TestCase } from '../../lib/runner';

export const testCase: TestCase = {
  id: 'tailor-marcus-regulatory',
  description: 'Tailor Marcus CV for RA Manager JD — overqualification in flags, cannot_cover not empty',
  pipeline: 'tailoring',
  input: {
    jd_text: loadFixture('jds/regulatory-affairs-meddevice.txt'),
    candidate_profile: loadFixture('cvs/senior-healthtech-usa.json'),
  },
  assertions: [
    { type: 'array_not_empty', path: 'pre_apply_flags' },
    { type: 'array_not_empty', path: 'tailoring_summary.cannot_cover_by_tailoring' },
  ],
};
