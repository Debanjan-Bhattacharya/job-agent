import { loadFixture } from '../../lib/fixtures';
import type { TestCase } from '../../lib/runner';

export const testCase: TestCase = {
  id: 'jd-analysis-sustainability',
  description: 'Sustainability reporting JD — credentials category present (BRSR/GRI), 5-10yr half-life',
  pipeline: 'jd-analysis',
  input: { jd_text: loadFixture('jds/sustainability-reporting-manager.txt') },
  assertions: [
    { type: 'object_not_empty', path: 'active_categories.C1_credentials' },
    { type: 'field_equals', path: 'knowledge_half_life', expected: '5-10yr' },
  ],
};
