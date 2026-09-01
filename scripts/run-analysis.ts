import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';

import { resolve } from 'node:path';

const projectRoot = process.cwd();

function argumentValue(args: string[], name: string): string {
  const index = args.indexOf(name);
  const value = index >= 0 ? args[index + 1] : undefined;
  if (!value || value.startsWith('--')) {
    throw new Error(`Usage: npx tsx scripts/run-analysis.ts --feature <name> --test-cases <path> --automation <path>`);
  }
  return value;
}

interface AnalysisResult {
  schema_version: string;
  analysis_type: string;
  test_case: {
    id: string;
    title: string;
    contract: string;
  };
  test_status: 'PASSED' | 'FAILED' | 'UNKNOWN';
  failure_classification:
    | 'NONE'
    | 'APPLICATION_DEFECT'
    | 'AUTHENTICATION_FAILURE'
    | 'TEST_FAILURE'
    | 'ENVIRONMENT_FAILURE'
    | 'UNKNOWN';
  confidence: 'high' | 'medium' | 'low';
  application_defect: boolean;
  evidence: Array<{
    type: string;
    path: string;
    observations: string[];
  }>;
  reasoning: string[];
  recommended_next_action: {
    action: string;
    required_variables?: string[];
    notes: string[];
  };
  limitations: string[];
}

interface JsonResult { title?: string; status?: string; duration?: number; error?: { message?: string } | null; attachments?: Array<{ name?: string; path?: string }> }

function collectJsonResults(value: unknown): JsonResult[] {
  if (!value || typeof value !== 'object') return [];
  const object = value as Record<string, unknown>;
  const own = Array.isArray(object.results) ? object.results.filter((item): item is JsonResult => !!item && typeof item === 'object').map((item) => ({ ...item, title: item.title ?? String(object.title ?? '') })) : [];
  const tests = Array.isArray(object.tests) ? object.tests.flatMap((test) => {
    if (!test || typeof test !== 'object') return [];
    const testObject = test as Record<string, unknown>;
    return Array.isArray(testObject.results)
      ? testObject.results.filter((item): item is JsonResult => !!item && typeof item === 'object').map((item) => ({ ...item, title: String(object.title ?? '') }))
      : [];
  }) : [];
  const nested = Array.isArray(object.suites) ? object.suites.flatMap(collectJsonResults) : [];
  const specs = Array.isArray(object.specs) ? object.specs.flatMap(collectJsonResults) : [];
  return [...own, ...tests, ...nested, ...specs];
}

function evidenceFor(result: JsonResult, featureName: string): AnalysisResult['evidence'] {
  const evidence = (result.attachments ?? []).filter((item) => item.path && existsSync(resolve(projectRoot, item.path))).map((item) => ({
    type: item.name ?? 'playwright-artifact', path: item.path!, observations: ['Artifact was produced by the Playwright JSON reporter.'],
  }));
  const reporterPath = `artifacts/playwright-report/${featureName}.results.json`;
  if (existsSync(resolve(projectRoot, reporterPath))) evidence.push({ type: 'playwright-json-report', path: reporterPath, observations: ['Machine-readable result for the feature-specific Playwright execution.'] });
  if (existsSync(resolve(projectRoot, 'test-results'))) evidence.push({ type: 'playwright-test-results', path: 'test-results', observations: ['Playwright output directory produced by this execution.'] });
  return evidence;
}

function ensureDirectory(analysisDirectory: string): void {
  mkdirSync(analysisDirectory, { recursive: true });
}

function buildPassedAnalysis(
  testCaseId: string,
  title: string,
  contractPath: string, evidence: AnalysisResult['evidence'], duration: number | null,
): AnalysisResult {
  return {
    schema_version: '1.0',
    analysis_type:
      'playwright_execution_result',

    test_case: {
      id: testCaseId,
      title,
      contract: contractPath,
    },

    test_status: 'PASSED',

    failure_classification: 'NONE',

    confidence: 'high',

    application_defect: false,

    evidence,

    reasoning: [
      'The Playwright execution completed successfully for this test case.',
      'No failed assertion was reported for the test case.',
      `Playwright reported a passed result${duration === null ? '' : ` after ${duration} ms`}.`,
    ],

    recommended_next_action: {
      action:
        'No corrective action is required for this test case based on the available execution result.',
      notes: [
        'Continue monitoring the scenario through regression execution.',
      ],
    },

    limitations: [
      'This analysis is based on the recorded Playwright execution result.',
      'A passing automated test does not establish that the feature is defect-free.',
    ],
  };
}

function buildAuthenticationFailure(
  testCaseId: string,
  title: string,
  contractPath: string, evidence: AnalysisResult['evidence'], failureMessage: string,
): AnalysisResult {
  return {
    schema_version: '1.0',

    analysis_type:
      'playwright_execution_failure',

    test_case: {
      id: testCaseId,
      title,
      contract: contractPath,
    },

    test_status: 'FAILED',

    failure_classification:
      'AUTHENTICATION_FAILURE',

    confidence: 'high',

    application_defect: false,

    evidence,

    reasoning: [
      'The test failed before application interaction.',
      `Playwright reported: ${failureMessage}`,
      'The failure is not classified as an application defect without evidence that the application contradicted a requirement.',
    ],

    recommended_next_action: {
      action:
        'Provide the required test credentials through environment variables or approved secret management and rerun the test.',

      required_variables: [
        'TEST_STANDARD_USER_USERNAME or TEST_USERNAME',
        'TEST_STANDARD_USER_PASSWORD or TEST_PASSWORD',
      ],

      notes: [
        'Do not hardcode credentials.',
        'Do not commit credentials to the repository.',
        'Analyze any subsequent failure independently.',
      ],
    },

    limitations: [
      'This analysis is based on the available execution artifacts.',
      'No application behavior can be evaluated when authentication configuration is missing.',
    ],
  };
}

function analyzeTestResults(
  featureName: string,
  testCasesPath: string,
  automationPath: string,
): AnalysisResult[] {
  /*
   * Checkpoint 1.17 intentionally uses the existing
   * Playwright result artifacts without an external LLM.
   *
   * The next iteration can replace this deterministic
   * classification with an Analysis Agent.
   */

  const testResultsPath = resolve(projectRoot, 'test-results');
  if (!existsSync(testResultsPath)) {
    throw new Error(
      `Playwright results directory does not exist: ${testResultsPath}`,
    );
  }

  /*
   * For the first implementation we use the existing
   * result metadata when available.
   *
   * The important architectural contract is that Analysis
   * consumes Execution artifacts and produces analysis artifacts.
   */

  const testCasesData = JSON.parse(readFileSync(testCasesPath, 'utf8')) as {
    test_cases?: Array<{ id: string; title: string }>;
  };
  const automationData = JSON.parse(readFileSync(automationPath, 'utf8')) as {
    test_cases?: Array<{ test_case_id: string; automation_status: string }>;
  };
  const testCases = testCasesData.test_cases ?? [];
  const automatedIds = new Set(
    (automationData.test_cases ?? [])
      .filter((item) => item.automation_status === 'automated')
      .map((item) => item.test_case_id),
  );

  const results: AnalysisResult[] = [];

  const jsonFiles = readdirSync(resolve(projectRoot, 'artifacts/playwright-report'))
    .filter((file) => file.endsWith('.results.json'));
  const jsonResults = jsonFiles.flatMap((file) => collectJsonResults(JSON.parse(readFileSync(resolve(projectRoot, 'artifacts/playwright-report', file), 'utf8'))));
  for (const testCase of testCases.filter((item) => automatedIds.has(item.id))) {
    const result = jsonResults.find((item) => item.title?.includes(testCase.id));
    if (!result) continue;
    const passed = result.status === 'passed';
    results.push(passed
      ? buildPassedAnalysis(testCase.id, testCase.title, testCasesPath, evidenceFor(result, featureName), result.duration ?? null)
      : buildAuthenticationFailure(testCase.id, testCase.title, testCasesPath, evidenceFor(result, featureName), result.error?.message ?? `status=${result.status ?? 'unknown'}`));
  }

  return results;
}

function persistResults(results: AnalysisResult[], analysisDirectory: string): void {
  ensureDirectory(analysisDirectory);

  for (const result of results) {
    const outputPath = resolve(
      analysisDirectory,
      `${result.test_case.id}-result-analysis.json`,
    );

    writeFileSync(
      outputPath,
      `${JSON.stringify(result, null, 2)}\n`,
      'utf8',
    );

    console.log(
      `Analysis artifact generated: ${outputPath}`,
    );
  }
}

function main(): void {
  try {
    const args = process.argv.slice(2);
    const featureName = argumentValue(args, '--feature');
    const testCasesPath = resolve(projectRoot, argumentValue(args, '--test-cases'));
    const automationPath = resolve(projectRoot, argumentValue(args, '--automation'));
    const analysisDirectory = resolve(projectRoot, 'artifacts/analysis', featureName);
    if (!existsSync(testCasesPath)) throw new Error(`Test Design artifact does not exist: ${testCasesPath}`);
    if (!existsSync(automationPath)) throw new Error(`Automation artifact does not exist: ${automationPath}`);
    const results = analyzeTestResults(featureName, testCasesPath, automationPath);

    if (results.length === 0) {
      throw new Error(
        'No Playwright execution results were available for analysis.',
      );
    }

    persistResults(results, analysisDirectory);

    console.log(
      'Analysis completed successfully.',
    );
  } catch (error) {
    console.error(
      error instanceof Error
        ? error.message
        : String(error),
    );

    process.exitCode = 1;
  }
}

main();
