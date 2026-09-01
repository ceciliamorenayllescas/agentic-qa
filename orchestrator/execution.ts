import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

export interface ExecutionTestResult {
  test_case_id: string;
  status: 'passed' | 'failed' | 'skipped';
  project: string;
  test_file: string;
  duration_ms: number | null;
  error: string | null;
}

export interface ExecutionResult {
  schema_version: '1.0';
  execution_id: string;
  started_at: string;
  completed_at: string;
  status: 'passed' | 'failed';
  tests: ExecutionTestResult[];
  artifacts: string[];
}

export interface ExecutionOptions {
  featureName: string;
  testFilePath: string;
  testCaseId: string;
}

const projectRoot = process.cwd();

const resultsDirectory =
  'artifacts/execution';

const playwrightResultsDirectory =
  'test-results';

const executionReportDirectory =
  'artifacts/playwright-report';

function now(): string {
  return new Date().toISOString();
}

function createExecutionId(
  startedAt: string,
): string {
  return `execution-${startedAt.replace(
    /[:.]/g,
    '-',
  )}`;
}

function runPlaywright(testFilePath: string): void {
  const command =
    process.platform === 'win32'
      ? 'npx.cmd'
      : 'npx';

  execFileSync(
    command,
    [
      'playwright',
      'test',
      testFilePath,
    ],
    {
      cwd: projectRoot,
      stdio: 'inherit',
    },
  );
}

function collectArtifacts(): string[] {
  const artifacts: string[] = [];

  if (
    existsSync(
      resolve(
        projectRoot,
        playwrightResultsDirectory,
      ),
    )
  ) {
    artifacts.push(
      playwrightResultsDirectory,
    );
  }

  if (
    existsSync(
      resolve(
        projectRoot,
        executionReportDirectory,
      ),
    )
  ) {
    artifacts.push(
      executionReportDirectory,
    );
  }

  return artifacts;
}

export function runExecution(options: ExecutionOptions): ExecutionResult {
  const startedAt = now();

  const executionId =
    createExecutionId(startedAt);

  const resultsPath =
    resolve(
      projectRoot,
      resultsDirectory,
    );

  mkdirSync(
    resultsPath,
    {
      recursive: true,
    },
  );

  let status:
    | 'passed'
    | 'failed' = 'passed';

  let error: string | null = null;

  try {
    runPlaywright(options.testFilePath);
  } catch (executionError) {
    status = 'failed';

    error =
      executionError instanceof Error
        ? executionError.message
        : String(executionError);
  }

  const completedAt = now();

  const artifacts =
    collectArtifacts();

  const result: ExecutionResult = {
    schema_version: '1.0',
    execution_id: executionId,
    started_at: startedAt,
    completed_at: completedAt,
    status,
    tests: [
      {
        test_case_id: options.testCaseId,
        status,
        project: 'chromium',
        test_file: options.testFilePath,
        duration_ms: null,
        error,
      },
    ],
    artifacts,
  };

  const resultPath =
    resolve(
      resultsPath,
      `${executionId}.json`,
    );

  writeFileSync(
    resultPath,
    `${JSON.stringify(
      result,
      null,
      2,
    )}\n`,
    'utf8',
  );

  return result;
}
