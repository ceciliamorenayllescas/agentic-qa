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
    throw new Error(`Usage: npx tsx scripts/run-report.ts --feature <name> --test-cases <path> --automation <path> --analysis <path> --exploratory <path> --output <path>`);
  }
  return value;
}

interface TestCase {
  id: string;
  title: string;
  priority: string;
}

interface AutomationResult {
  test_case_id: string;
  automation_status: 'automated' | 'not_automated';
  test_file: string | null;
  reason?: string;
}

interface AnalysisResult {
  test_case_id: string;
  test_status?: string;
  failure_classification?: string;
  status?: string;
  result?: string;
  classification?: string;
  summary?: string;
}

interface QaReport {
  feature: string;
  generated_at: string;
  summary: {
    total_test_cases: number;
    automated_test_cases: number;
    not_automated_test_cases: number;
    analysis_results: number;
    exploratory_findings: number;
    overall_status: string;
  };
  test_cases: TestCase[];
  automation: AutomationResult[];
  analysis: AnalysisResult[];
  exploratory_findings: string[];
  automation_execution: { status: 'executed' | 'not_run'; reason?: string };
  exploratory: { status: 'executed' | 'executed_with_gaps' | 'skipped' | 'failed'; charters_executed: number; observations: number; defects: number; unknowns_resolved: number; error?: string };
}

function readJson<T>(filePath: string): T {
  if (!existsSync(filePath)) {
    throw new Error(
      `Required artifact does not exist: ${filePath}`,
    );
  }

  const content = readFileSync(filePath, 'utf8');

  if (!content.trim()) {
    throw new Error(
      `Artifact is empty: ${filePath}`,
    );
  }

  try {
    return JSON.parse(content) as T;
  } catch {
    throw new Error(
      `Artifact is not valid JSON: ${filePath}`,
    );
  }
}

function readTestCases(testCasesPath: string): TestCase[] {
  const data = readJson<unknown>(testCasesPath);

  if (Array.isArray(data)) {
    return data as TestCase[];
  }

  if (
    typeof data === 'object' &&
    data !== null &&
    'test_cases' in data &&
    Array.isArray(
      (data as { test_cases: unknown }).test_cases,
    )
  ) {
    return (
      (data as { test_cases: TestCase[] }).test_cases
    );
  }

  throw new Error(
    'Test Design artifact does not contain a valid test_cases array.',
  );
}

function readAutomation(automationPath: string): AutomationResult[] {
  const data = readJson<unknown>(automationPath);

  if (Array.isArray(data)) {
    return data as AutomationResult[];
  }

  if (
    typeof data === 'object' &&
    data !== null &&
    'test_cases' in data &&
    Array.isArray(
      (data as { test_cases: unknown }).test_cases,
    )
  ) {
    return (
      (data as { test_cases: AutomationResult[] }).test_cases
    );
  }

  if (
    typeof data === 'object' &&
    data !== null &&
    'results' in data &&
    Array.isArray(
      (data as { results: unknown }).results,
    )
  ) {
    return (
      (data as { results: AutomationResult[] }).results
    );
  }

  throw new Error(
    'Automation artifact does not contain a valid test case result list.',
  );
}

function readAnalysis(analysisDirectory: string): AnalysisResult[] {
  if (!existsSync(analysisDirectory)) {
    return [];
  }

  const files = readdirSync(analysisDirectory)
    .filter((file) => file.endsWith('.json'));

  const results: AnalysisResult[] = [];

  for (const file of files) {
    const filePath = resolve(
      analysisDirectory,
      file,
    );

    try {
      const result = readJson<AnalysisResult>(filePath);
      results.push(result);
    } catch {
      console.warn(
        `Skipping invalid analysis artifact: ${file}`,
      );
    }
  }

  return results;
}

function readExploratoryFindings(exploratoryDirectory: string): string[] {
  if (!existsSync(exploratoryDirectory)) {
    return [];
  }

  return readdirSync(exploratoryDirectory)
    .filter((file) => file.endsWith('.json'))
    .filter((file) => file !== 'exploration-session.json')
    .map((file) =>
      resolve(exploratoryDirectory, file),
    );
}

function determineOverallStatus(
  analysis: AnalysisResult[],
): string {
  if (analysis.length === 0) {
    return 'NO_ANALYSIS';
  }

  const statuses = analysis
    .map((result) =>
      String(
        result.test_status ??
        result.failure_classification ??
        result.status ??
        result.result ??
        result.classification ??
        '',
      ).toLowerCase(),
    );

  if (
    statuses.some(
      (status) =>
        status === 'fail' ||
        status === 'failed' ||
        status === 'defect',
    )
  ) {
    return 'FAILED';
  }

  if (
    statuses.some(
      (status) =>
        status === 'blocked' ||
        status === 'environment_error' ||
        status === 'test_error',
    )
  ) {
    return 'BLOCKED';
  }

  if (
    statuses.length > 0 &&
    statuses.every(
      (status) =>
        status === 'pass' ||
        status === 'passed' ||
        status === 'success',
    )
  ) {
    return 'PASSED';
  }

  return 'REVIEW_REQUIRED';
}

function main(): void {
  console.log('Starting Report generation...');

  const args = process.argv.slice(2);
  const featureName = argumentValue(args, '--feature');
  const testCasesPath = resolve(projectRoot, argumentValue(args, '--test-cases'));
  const automationPath = resolve(projectRoot, argumentValue(args, '--automation'));
  const analysisDirectory = resolve(projectRoot, argumentValue(args, '--analysis'));
  let exploratoryDirectory = resolve(projectRoot, argumentValue(args, '--exploratory'));
  const outputPath = resolve(projectRoot, argumentValue(args, '--output'));
  const outputDirectory = resolve(outputPath, '..');

  // Compatibility with the pre-feature-scoped Add To Cart findings.
  if (featureName === 'add-product-to-cart') {
    const scopedFindings = existsSync(exploratoryDirectory)
      ? readdirSync(exploratoryDirectory).filter((file) => file.endsWith('.json'))
      : [];
    if (scopedFindings.length === 0) exploratoryDirectory = resolve(projectRoot, 'artifacts/exploratory');
  }

  const testCases = readTestCases(testCasesPath);
  const automation = readAutomation(automationPath);
  const analysis = readAnalysis(analysisDirectory);
  const exploratoryFindings =
    readExploratoryFindings(exploratoryDirectory);
  let exploratorySession: { exploratory_status?: 'executed' | 'executed_with_gaps' | 'failed'; charters_executed?: number; findings_generated?: number; error?: string } = {};
  const exploratorySessionPath = resolve(exploratoryDirectory, 'exploration-session.json');
  if (existsSync(exploratorySessionPath)) {
    try { exploratorySession = readJson<typeof exploratorySession>(exploratorySessionPath); } catch { exploratorySession = { exploratory_status: 'failed', error: 'Invalid exploration-session.json' }; }
  }
  const exploratoryData = exploratoryFindings.map((filePath) => {
    try { return readJson<{ type?: string; status?: string }>(filePath); } catch { return {}; }
  });
  const exploratoryStatus = exploratorySession.exploratory_status ?? 'failed';

  const automatedTestCases =
    automation.filter(
      (item) =>
        item.automation_status === 'automated',
    ).length;

  const notAutomatedTestCases =
    automation.filter(
      (item) =>
      item.automation_status === 'not_automated',
    ).length;
  const automationExecution = automatedTestCases === 0
    ? { status: 'not_run' as const, reason: 'No automated test cases were available.' }
    : { status: 'executed' as const };

  const report: QaReport = {
    feature: featureName,
    generated_at: new Date().toISOString(),

    summary: {
      total_test_cases: testCases.length,
      automated_test_cases: automatedTestCases,
      not_automated_test_cases: notAutomatedTestCases,
      analysis_results: analysis.length,
      exploratory_findings:
        exploratoryFindings.length,
      overall_status: automatedTestCases === 0 ? 'REVIEW_REQUIRED' : determineOverallStatus(analysis),
    },

    test_cases: testCases,

    automation,

    analysis,

    exploratory_findings:
    exploratoryFindings.map(
        (filePath) =>
          filePath
            .replace(projectRoot, '')
            .replace(/^[/\\]+/, ''),
      ),
    automation_execution: automationExecution,
    exploratory: {
      status: exploratoryStatus,
      charters_executed: exploratorySession.charters_executed ?? 0,
      observations: exploratoryData.filter((item) => item.type === 'observation' || item.status === 'observation' || item.status === 'not_a_defect').length,
      defects: exploratoryData.filter((item) => item.type === 'defect' || item.type === 'unexpected_behavior' || item.status === 'potential_defect' || item.status === 'confirmed_defect').length,
      unknowns_resolved: exploratoryData.filter((item) => item.type === 'unknown_resolved').length,
      ...(exploratorySession.error ? { error: exploratorySession.error } : {}),
    },
  };

  if (!existsSync(outputDirectory)) {

    mkdirSync(outputDirectory, {
      recursive: true,
    });
  }

  writeFileSync(
    outputPath,
    JSON.stringify(report, null, 2) + '\n',
    'utf8',
  );

  console.log(
    'Report generation completed.',
  );

  console.log(
    `Test cases: ${testCases.length}`,
  );

  console.log(
    `Automated: ${automatedTestCases}`,
  );

  console.log(
    `Not automated: ${notAutomatedTestCases}`,
  );

  console.log(
    `Analysis results: ${analysis.length}`,
  );

  console.log(
    `Exploratory findings: ${exploratoryFindings.length}`,
  );
  console.log(`Exploratory executed: ${['executed', 'executed_with_gaps'].includes(exploratoryStatus) ? 'yes' : 'no'}`);
  console.log(`Charters executed: ${exploratorySession.charters_executed ?? 0}`);
  console.log(`Observations: ${exploratoryData.filter((item) => item.type === 'observation' || item.status === 'observation' || item.status === 'not_a_defect').length}`);
  console.log(`Defects: ${exploratoryData.filter((item) => item.type === 'defect' || item.type === 'unexpected_behavior' || item.status === 'potential_defect' || item.status === 'confirmed_defect').length}`);
  console.log(`Unknowns resolved: ${exploratoryData.filter((item) => item.type === 'unknown_resolved').length}`);

  console.log(
    `Overall status: ${report.summary.overall_status}`,
  );

  console.log(
    `Output: ${outputPath}`,
  );
}

main();

