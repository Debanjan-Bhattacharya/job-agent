import { loadFixture } from '../../lib/fixtures';
import type { TestCase } from '../../lib/runner';

export const testCase: TestCase = {
  id: 'jd-analysis-lawyer',
  description: 'Private practice lawyer JD — LLB mandatory gate, medium confidence, no quantified impact category',
  pipeline: 'jd-analysis',
  input: { jd_text: loadFixture('jds/lawyer-private.txt') },
  assertions: [
    { type: 'field_equals', path: 'jd_confidence', expected: 'high' },
    { type: 'field_equals', path: 'jd_confidence', expected: 'high' }
  ],
};
