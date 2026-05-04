import { loadFixture } from '../../lib/fixtures';
import type { TestCase } from '../../lib/runner';

export const testCase: TestCase = {
  id: 'jd-analysis-employer-contact',
  description: 'Spinny PM JD — employer_contact field should exist in output schema',
  pipeline: 'jd-analysis',
  input: { jd_text: loadFixture('jds/spinny-pm.txt') },
  assertions: [
    { type: 'field_not_present', path: 'employer_contact.error' },
    { type: 'field_equals', path: 'jd_confidence', expected: 'high' },
  ],
};
