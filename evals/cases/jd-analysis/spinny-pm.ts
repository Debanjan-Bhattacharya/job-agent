import { loadFixture } from '../../lib/fixtures';
import type { TestCase } from '../../lib/runner';

export const testCase: TestCase = {
  id: 'jd-analysis-spinny-pm',
  description: 'Spinny PM JD — preferred requirements should not become mandatory gates',
  pipeline: 'jd-analysis',
  input: { jd_text: loadFixture('jds/spinny-pm.txt') },
  assertions: [
    { type: 'array_empty', path: 'mandatory_gates' },
    { type: 'array_not_empty', path: 'preferred_requirements' },
    { type: 'field_equals', path: 'knowledge_half_life', expected: '2-5yr' },
    { type: 'field_equals', path: 'work_schedule_requirements.work_arrangement', expected: 'wfo' },
    { type: 'field_equals', path: 'jd_confidence', expected: 'high' },
  ],
};
