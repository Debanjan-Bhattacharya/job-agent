import { loadFixture } from '../../lib/fixtures';
import type { TestCase } from '../../lib/runner';

export const testCase: TestCase = {
  id: 'jd-analysis-lawyer',
  description: 'Private practice lawyer JD — LLB mandatory gate, medium confidence, no quantified impact category',
  pipeline: 'jd-analysis',
  input: { jd_text: loadFixture('jds/lawyer-private.txt') },
  assertions: [
    { type: 'array_not_empty', path: 'mandatory_gates' },
    { type: 'field_equals', path: 'jd_confidence', expected: 'medium' },
    { type: 'field_not_present', path: 'active_categories.C6_quantified_impact' },
  ],
};
