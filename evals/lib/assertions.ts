import _ from 'lodash';

export type Assertion =
  | { type: 'field_equals'; path: string; expected: unknown }
  | { type: 'field_in_range'; path: string; min: number; max: number }
  | { type: 'field_not_present'; path: string }
  | { type: 'array_not_empty'; path: string }
  | { type: 'array_empty'; path: string }
  | { type: 'object_not_empty'; path: string }
  | { type: 'string_not_contains'; path: string; forbidden: string }
  | { type: 'array_length_gte'; path: string; min: number }
  | { type: 'score_consistency'; runs: number; maxVariance: number; scorePath: string };

export interface AssertionResult {
  passed: boolean;
  message: string;
}

export function runAssertion(assertion: Assertion, data: Record<string, unknown>): AssertionResult {
  switch (assertion.type) {
    case 'field_equals': {
      const value = _.get(data, assertion.path);
      const passed = JSON.stringify(value) === JSON.stringify(assertion.expected);
      return {
        passed,
        message: passed
          ? `✓ field_equals: ${assertion.path} === ${JSON.stringify(assertion.expected)}`
          : `✗ field_equals: ${assertion.path} = ${JSON.stringify(value)}, expected ${JSON.stringify(assertion.expected)}`,
      };
    }

    case 'field_in_range': {
      const value = _.get(data, assertion.path) as number;
      const passed = typeof value === 'number' && value >= assertion.min && value <= assertion.max;
      return {
        passed,
        message: passed
          ? `✓ field_in_range: ${assertion.path} = ${value} ∈ [${assertion.min}, ${assertion.max}]`
          : `✗ field_in_range: ${assertion.path} = ${JSON.stringify(value)}, expected ∈ [${assertion.min}, ${assertion.max}]`,
      };
    }

    case 'field_not_present': {
      const value = _.get(data, assertion.path);
      const passed = value === undefined;
      return {
        passed,
        message: passed
          ? `✓ field_not_present: ${assertion.path} absent`
          : `✗ field_not_present: ${assertion.path} = ${JSON.stringify(value)} (should be absent)`,
      };
    }

    case 'array_not_empty': {
      const value = _.get(data, assertion.path);
      const passed = Array.isArray(value) && (value as unknown[]).length > 0;
      return {
        passed,
        message: passed
          ? `✓ array_not_empty: ${assertion.path} has ${(value as unknown[]).length} item(s)`
          : `✗ array_not_empty: ${assertion.path} = ${JSON.stringify(value)}`,
      };
    }

    case 'array_empty': {
      const value = _.get(data, assertion.path);
      const len = Array.isArray(value) ? (value as unknown[]).length : -1;
      const passed = Array.isArray(value) && len === 0;
      return {
        passed,
        message: passed
          ? `✓ array_empty: ${assertion.path} is empty`
          : `✗ array_empty: ${assertion.path} has ${len === -1 ? 'non-array value' : `${len} item(s)`}: ${JSON.stringify(value)}`,
      };
    }

    case 'object_not_empty': {
      const value = _.get(data, assertion.path);
      const passed = typeof value === 'object' && value !== null && !Array.isArray(value) && Object.keys(value).length > 0;
      return {
        passed,
        message: passed
          ? `✓ object_not_empty: ${assertion.path} has ${Object.keys(value as object).length} key(s)`
          : `✗ object_not_empty: ${assertion.path} = ${JSON.stringify(value)}`,
      };
    }

    case 'string_not_contains': {
      const value = _.get(data, assertion.path);
      const passed = typeof value === 'string' && !value.includes(assertion.forbidden);
      return {
        passed,
        message: passed
          ? `✓ string_not_contains: "${assertion.forbidden}" absent from ${assertion.path}`
          : `✗ string_not_contains: "${assertion.forbidden}" found in ${assertion.path}`,
      };
    }

    case 'array_length_gte': {
      const value = _.get(data, assertion.path);
      const len = Array.isArray(value) ? (value as unknown[]).length : -1;
      const passed = len >= assertion.min;
      return {
        passed,
        message: passed
          ? `✓ array_length_gte: ${assertion.path} has ${len} item(s) (≥ ${assertion.min})`
          : `✗ array_length_gte: ${assertion.path} has ${len === -1 ? 'non-array' : len} item(s), expected ≥ ${assertion.min}`,
      };
    }

    case 'score_consistency':
      // Handled by runner — placeholder result, never reached for static evaluation
      return { passed: true, message: '(score_consistency: evaluated by runner)' };
  }
}
