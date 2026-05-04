import { loadFixture } from '../../lib/fixtures';
import type { TestCase } from '../../lib/runner';

export const testCase: TestCase = {
  id: 'cv-analysis-grad',
  description: 'Grad product CV — tier grad, high confidence, quantified achievements present',
  pipeline: 'cv-analysis',
  input: { candidate_profile: loadFixture('cvs/grad-product-india.json') },
  assertions: [
    { type: 'field_equals', path: 'experience_tier', expected: 'grad' },
    { type: 'field_equals', path: 'cv_confidence', expected: 'medium' },
    { type: 'field_equals', path: 'evidence_inventory.has_quantified_achievements', expected: true },
  ],
};
