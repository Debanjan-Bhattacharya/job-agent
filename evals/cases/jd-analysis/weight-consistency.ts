import { loadFixture } from '../../lib/fixtures';
import type { TestCase } from '../../lib/runner';

export const testCase: TestCase = {
  id: 'jd-analysis-weight-consistency',
  description: 'Spinny JD — category weights must be identical across 3 runs',
  pipeline: 'jd-analysis',
  input: { jd_text: loadFixture('jds/spinny-pm.txt') },
  assertions: [
    { type: 'score_consistency', runs: 3, maxVariance: 0, scorePath: 'active_categories.C2_experience.weight' },
    { type: 'score_consistency', runs: 3, maxVariance: 0, scorePath: 'active_categories.C4_skills.weight' },
  ],
};
