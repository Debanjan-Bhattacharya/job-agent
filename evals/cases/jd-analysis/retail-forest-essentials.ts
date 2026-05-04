import { loadFixture } from '../../lib/fixtures';
import type { TestCase } from '../../lib/runner';

export const testCase: TestCase = {
  id: 'jd-analysis-retail-forest-essentials',
  description: 'Forest Essentials Store Manager JD — culture fit category present, WFO, 5-10yr half-life',
  pipeline: 'jd-analysis',
  input: { jd_text: loadFixture('jds/retail-store-manager-forest-essentials.txt') },
  assertions: [
    { type: 'object_not_empty', path: 'active_categories.C8_culture_fit' },
    { type: 'field_equals', path: 'work_schedule_requirements.work_arrangement', expected: 'wfo' },
    { type: 'field_equals', path: 'knowledge_half_life', expected: '5-10yr' },
  ],
};
