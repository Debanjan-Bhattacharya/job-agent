import { loadFixture } from '../../lib/fixtures';
import type { TestCase } from '../../lib/runner';

export const testCase: TestCase = {
  id: 'cv-analysis-inconsistent-years',
  description: 'Priya backend CV — stated 1yr experience but dates show more; cv_gaps should flag inconsistency',
  pipeline: 'cv-analysis',
  input: { candidate_profile: loadFixture('cvs/grad-backend-india.json') },
  assertions: [
    { type: 'array_not_empty', path: 'cv_gaps' },
  ],
};
