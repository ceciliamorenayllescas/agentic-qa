import type { AutomationResult } from '../agents/automation/index.js';

export interface GeneratedSpecValidation {
  workerSucceeded: boolean;
  expectedTestFile: string;
  specExists: boolean;
  correspondsToTestCase: boolean;
  typescriptValid: boolean;
  semanticCoverageComplete: boolean;
  generatedSpecValid: boolean;
}

export interface FallbackAudit {
  invoked: boolean;
  reason_code: string;
  unsupported_step?: number;
  unsupported_operation?: string;
  resolved: boolean;
}

export function reconcileAutomationResult(
  result: AutomationResult,
  testCaseId: string,
  validation: GeneratedSpecValidation,
): AutomationResult {
  const current = result.test_cases.find((item) => item.test_case_id === testCaseId);
  if (!current) throw new Error(`Cannot reconcile unknown test case: ${testCaseId}`);

  const fallback: FallbackAudit = {
    invoked: true,
    reason_code: current.unsupported_operation ? 'missing_capability' : 'deterministic_gap',
    ...(current.unsupported_step === undefined ? {} : { unsupported_step: current.unsupported_step }),
    ...(current.unsupported_operation === undefined ? {} : { unsupported_operation: current.unsupported_operation }),
    resolved: validation.workerSucceeded && validation.specExists && validation.correspondsToTestCase
      && validation.typescriptValid && validation.semanticCoverageComplete && validation.generatedSpecValid,
  };

  const promoted = fallback.resolved;
  const testCases = result.test_cases.map((item) => {
    if (item.test_case_id !== testCaseId) return item;
    if (!promoted) return { ...item, fallback };
    return {
      test_case_id: item.test_case_id,
      automation_status: 'automated' as const,
      test_file: validation.expectedTestFile,
      generation: { mode: 'codex_fallback' as const },
      fallback,
    };
  });

  const automated = testCases.filter((item) => item.automation_status === 'automated').length;
  return {
    ...result,
    test_cases: testCases,
    summary: {
      ...result.summary,
      total: testCases.length,
      automated,
      not_automated: testCases.length - automated,
      automation_coverage: testCases.length ? automated / testCases.length : 0,
    },
  };
}
