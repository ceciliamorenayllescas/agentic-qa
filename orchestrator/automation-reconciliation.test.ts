import { test } from 'node:test';
import assert from 'node:assert/strict';
import { reconcileAutomationResult } from './automation-reconciliation.js';
import type { AutomationResult } from '../agents/automation/index.js';

function result(): AutomationResult {
  return {
    schema_version: '1.1', feature: 'cart-management', test_cases: [{
      test_case_id: 'TC-CARTMANA-001', automation_status: 'not_automated', test_file: null,
      unsupported_step: 8, unsupported_operation: 'missing capability', reason: 'planner gap',
    }], summary: { total: 1, automated: 0, not_automated: 1, automation_coverage: 0 },
  };
}

const valid = { workerSucceeded: true, expectedTestFile: 'tests/cart-management.spec.ts', specExists: true, correspondsToTestCase: true, typescriptValid: true, semanticCoverageComplete: true, generatedSpecValid: true };

test('promotes a deterministic gap when Codex produces a validated spec', () => {
  const reconciled = reconcileAutomationResult(result(), 'TC-CARTMANA-001', valid);
  assert.equal(reconciled.test_cases[0].automation_status, 'automated');
  assert.equal(reconciled.test_cases[0].test_file, 'tests/cart-management.spec.ts');
  assert.equal(reconciled.summary.automated, 1);
  assert.equal(reconciled.summary.not_automated, 0);
  assert.equal(reconciled.test_cases[0].unsupported_step, undefined);
  assert.equal(reconciled.test_cases[0].fallback?.resolved, true);
});

test('keeps a case unautomated when the Codex fallback fails', () => {
  const reconciled = reconcileAutomationResult(result(), 'TC-CARTMANA-001', { ...valid, workerSucceeded: false });
  assert.equal(reconciled.test_cases[0].automation_status, 'not_automated');
  assert.equal(reconciled.summary.automated, 0);
  assert.equal(reconciled.summary.not_automated, 1);
  assert.equal(reconciled.test_cases[0].fallback?.resolved, false);
});
