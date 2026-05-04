import { loadFixture } from '../../lib/fixtures';
import type { TestCase } from '../../lib/runner';

export const testCase: TestCase = {
  id: 'jd-analysis-workday',
  description: 'Workday JD — Workday certification should be mandatory gate',
  pipeline: 'jd-analysis',
  input: { jd_text: loadFixture('jds/workday-accounting.txt') },
  assertions: [
    { type: 'field_equals', path: 'knowledge_half_life', expected: '5-10yr' },
    { type: 'field_equals', path: 'jd_confidence', expected: 'high' }
  ]
}
