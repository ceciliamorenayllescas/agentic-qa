import { execFileSync } from 'node:child_process';

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';

import { basename, relative, resolve } from 'node:path';

import { runAutomationAgent } from '../agents/automation/index.js';
import { createAutomationRequest, runCodexAutomation } from '../agents/automation/codex-cli.js';
import { runDiscoveryAgent } from '../agents/discovery/index.js';
import { createTestDesignRequest, validateTestDesignArtifact } from '../agents/test-design/index.js';
import { runCodexTestDesign } from '../agents/test-design/codex-cli.js';
import { getFeatureName } from './feature.js';
import { reconcileAutomationResult, type GeneratedSpecValidation } from './automation-reconciliation.js';

import {
  artifactExists,
  registerArtifact,
  resolveArtifactPath,
} from './artifacts.js';

import {
  createPendingStages,
  workflowStages,
  type WorkflowStageName,
  type WorkflowState,
} from './state.js';

const projectRoot = process.cwd();

const workflowsDirectory = 'artifacts/workflows';

function now(): string {
  return new Date().toISOString();
}

function workflowIdFor(
  featurePath: string,
  createdAt: string,
): string {
  const featureName = basename(featurePath)
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-zA-Z0-9]+/g, '-');

  return `workflow-${featureName}-${createdAt.replace(
    /[:.]/g,
    '-',
  )}`;
}

function pathForState(
  absolutePath: string,
): string {
  return relative(projectRoot, absolutePath) || '.';
}

function featureNameForState(state: WorkflowState): string {
  return getFeatureName(state.feature);
}

function persistState(
  state: WorkflowState,
  statePath: string,
): void {
  state.updated_at = now();

  writeFileSync(
    statePath,
    `${JSON.stringify(state, null, 2)}\n`,
    'utf8',
  );
}

export function createWorkflowState(
  featurePath: string,
): WorkflowState {
  const featureAbsolutePath =
    resolveArtifactPath(
      projectRoot,
      featurePath,
    );

  if (
    !artifactExists(
      projectRoot,
      featurePath,
    )
  ) {
    throw new Error(
      `Feature file does not exist: ${featurePath}`,
    );
  }

  const createdAt = now();

  return {
    schema_version: '1.0',

    workflow_id: workflowIdFor(
      featureAbsolutePath,
      createdAt,
    ),

    feature: pathForState(
      featureAbsolutePath,
    ),

    status: 'pending',

    current_stage: null,

    created_at: createdAt,

    updated_at: createdAt,

    resume_from_stage: null,

    stages: createPendingStages(),
  };
}

function runPlaceholderStage(
  state: WorkflowState,
  stageName: WorkflowStageName,
  statePath: string,
): void {
  const stage =
    state.stages[stageName];

  state.status = 'running';

  state.current_stage = stageName;

  stage.status = 'running';

  stage.started_at = now();

  stage.completed_at = null;

  stage.error = null;

  persistState(
    state,
    statePath,
  );

  /*
   * Placeholder:
   *
   * This stage intentionally does not invoke
   * external services, Playwright, or agents yet.
   */

  stage.status = 'completed';

  stage.completed_at = now();

  persistState(
    state,
    statePath,
  );
}

function runDiscoveryStage(
  state: WorkflowState,
  statePath: string,
): void {
  const stage =
    state.stages.discovery;

  const discoveryArtifact =
    `contracts/${featureNameForState(state)}.discovery.yaml`;

  state.status = 'running';

  state.current_stage = 'discovery';

  stage.status = 'running';

  stage.started_at = now();

  stage.completed_at = null;

  stage.error = null;

  persistState(
    state,
    statePath,
  );

  if (!artifactExists(projectRoot, discoveryArtifact)) {
    runDiscoveryAgent({ featurePath: state.feature, outputPath: discoveryArtifact });
  }
  if (!artifactExists(projectRoot, discoveryArtifact)) throw new Error(`Discovery agent did not produce: ${discoveryArtifact}`);

  registerArtifact(
    projectRoot,
    stage,
    discoveryArtifact,
  );

  stage.status = 'completed';

  stage.completed_at = now();

  persistState(
    state,
    statePath,
  );
}

function runTestDesignStage(
  state: WorkflowState,
  statePath: string,
  resumed: boolean,
): boolean {
  const stage =
    state.stages.test_design;

  const featureName = featureNameForState(state);
  const discoveryArtifact =
    `contracts/${featureName}.discovery.yaml`;

  const testDesignArtifact = `contracts/${featureName}.test-cases.json`;
  const requestArtifact = `artifacts/test-design/${featureName}.request.json`;
  const mode = process.env.TEST_DESIGN_MODE ?? 'codex_cli';

  state.status = 'running';

  state.current_stage =
    'test_design';

  stage.status = 'running';

  stage.started_at = now();

  stage.completed_at = null;

  stage.error = null;

  persistState(
    state,
    statePath,
  );

  if (
    !artifactExists(
      projectRoot,
      discoveryArtifact,
    )
  ) {
    throw new Error(
      `Test Design cannot run because Discovery artifact does not exist: ${discoveryArtifact}`,
    );
  }

  if (!['codex_cli', 'codex_checkpoint', 'deterministic'].includes(mode)) {
    throw new Error(`Unsupported TEST_DESIGN_MODE: ${mode}. Use codex_cli, codex_checkpoint or deterministic.`);
  }

  createTestDesignRequest({ featurePath: state.feature, discoveryPath: discoveryArtifact, exploratoryDirectory: `artifacts/exploratory/${featureName}`, outputPath: requestArtifact, testDesignArtifactPath: testDesignArtifact, mode: mode === 'codex_checkpoint' ? 'codex_checkpoint' : 'codex_cli' });
  registerArtifact(projectRoot, stage, requestArtifact);

  if (mode === 'codex_cli') {
    runCodexTestDesign({ requestPath: requestArtifact, outputPath: testDesignArtifact, logPath: `artifacts/test-design/${featureName}.codex.log` });
  } else if (mode === 'deterministic') {
    execFileSync(
    process.platform === 'win32'
      ? 'npx.cmd'
      : 'npx',

    [
      'tsx',
      'scripts/run-test-design.ts',
      '--discovery',
      discoveryArtifact,
      '--output', testDesignArtifact, '--mode', 'deterministic',
    ],

    {
      cwd: projectRoot,
      stdio: 'inherit',
    },
    );
  } else if (!resumed) {
    stage.status = 'paused';
    stage.completed_at = null;
    state.status = 'paused';
    state.resume_from_stage = 'test_design';
    persistState(state, statePath);
    console.log(`Test Design checkpoint created: ${requestArtifact}`);
    console.log('Workflow paused: Codex must create the Test Design artifact before --resume.');
    return true;
  }

  if (
    !artifactExists(
      projectRoot,
      testDesignArtifact,
    )
  ) {
    if (mode !== 'codex_checkpoint') throw new Error(`Test Design artifact is missing after ${mode}: ${testDesignArtifact}`);
    stage.status = 'paused';
    stage.completed_at = null;
    state.status = 'paused';
    state.resume_from_stage = 'test_design';
    persistState(state, statePath);
    console.log(`Workflow remains paused: Test Design artifact is still missing: ${testDesignArtifact}`);
    return true;
  }

  const validated = validateTestDesignArtifact(testDesignArtifact, discoveryArtifact, `artifacts/exploratory/${featureName}`);
  const enriched = { ...validated, test_design_metadata: { mode, client: mode === 'codex_cli' ? 'codex_cli' : 'codex_checkpoint', api_calls: 0, api_cost_usd: 0, model: 'not asserted by workflow', tokens: 'not asserted by workflow' } };
  writeFileSync(resolveArtifactPath(projectRoot, testDesignArtifact), `${JSON.stringify(enriched, null, 2)}\n`, 'utf8');

  registerArtifact(
    projectRoot,
    stage,
    testDesignArtifact,
  );

  stage.status = 'completed';

  stage.completed_at = now();

  persistState(
    state,
    statePath,
  );
  state.resume_from_stage = null;
  persistState(state, statePath);
  return false;
}

function runExploratoryStage(
  state: WorkflowState,
  statePath: string,
): void {
  const stage =
    state.stages.exploratory;

  const featureName = featureNameForState(state);
  const featureExploratoryDirectory = `artifacts/exploratory/${featureName}`;

  state.status = 'running';

  state.current_stage =
    'exploratory';

  stage.status = 'running';

  stage.started_at = now();

  stage.completed_at = null;

  stage.error = null;

  persistState(
    state,
    statePath,
  );

  execFileSync(
    process.platform === 'win32'
      ? 'npx.cmd'
      : 'npx',

    [
      'tsx',
      'scripts/run-exploratory.ts',
      '--feature',
      state.feature,
      '--discovery',
      `contracts/${featureName}.discovery.yaml`,
      '--output',
      featureExploratoryDirectory,
    ],

    {
      cwd: projectRoot,
      stdio: 'inherit',
    },
  );

  const scopedExploratoryArtifacts = artifactExists(projectRoot, featureExploratoryDirectory)
    ? readdirSync(resolveArtifactPath(projectRoot, featureExploratoryDirectory)).filter((file) => file.endsWith('.json'))
    : [];
  const exploratoryDirectory = scopedExploratoryArtifacts.length > 0
    ? featureExploratoryDirectory
    : featureName === 'add-product-to-cart'
      ? 'artifacts/exploratory'
      : featureExploratoryDirectory;
  const exploratoryArtifacts = artifactExists(projectRoot, exploratoryDirectory)
    ? readdirSync(resolveArtifactPath(projectRoot, exploratoryDirectory))
        .filter((file) => file.endsWith('.json'))
        .map((file) => `${exploratoryDirectory}/${file}`)
    : [];

  for (const artifact of exploratoryArtifacts) {
    if (
      !artifactExists(
        projectRoot,
        artifact,
      )
    ) {
      throw new Error(
        `Exploratory artifact does not exist: ${artifact}`,
      );
    }

    registerArtifact(
      projectRoot,
      stage,
      artifact,
    );
  }

  if (featureName !== 'add-product-to-cart' && !artifactExists(projectRoot, featureExploratoryDirectory)) {
    mkdirSync(resolveArtifactPath(projectRoot, featureExploratoryDirectory), { recursive: true });
  }
  if (featureName !== 'add-product-to-cart') registerArtifact(projectRoot, stage, featureExploratoryDirectory);

  stage.status = 'completed';

  stage.completed_at = now();

  persistState(
    state,
    statePath,
  );
}

function runAutomationStage(
  state: WorkflowState,
  statePath: string,
): void {
  const stage =
    state.stages.automation;

  const featureName = featureNameForState(state);
  const testDesignArtifact = `contracts/${featureName}.test-cases.json`;
  const testFile = `tests/${featureName}.spec.ts`;
  const automationArtifact =
    `artifacts/automation/${featureName}.automation.json`;

  state.status = 'running';

  state.current_stage =
    'automation';

  stage.status = 'running';

  stage.started_at = now();

  stage.completed_at = null;

  stage.error = null;

  persistState(
    state,
    statePath,
  );

  /*
   * Invoke the Automation Agent.
   */

  const mode = process.env.AUTOMATION_MODE ?? 'hybrid';
  if (!['hybrid', 'deterministic', 'codex'].includes(mode)) throw new Error(`Unsupported AUTOMATION_MODE: ${mode}`);
  let result = runAutomationAgent({
    testDesignPath: testDesignArtifact,
    outputPath: automationArtifact,
    testFilePath: testFile,
    featureId: featureName,
    mode: mode as 'hybrid' | 'deterministic' | 'codex',
  });

  const gaps = result.test_cases.filter((item) => item.automation_status === 'not_automated');
  const workerTargets = mode === 'codex' ? result.test_cases : gaps;
  const shouldInvoke = mode === 'codex' || (mode === 'hybrid' && gaps.length > 0);
  if (shouldInvoke) {
    const design = JSON.parse(readFileSync(resolveArtifactPath(projectRoot, testDesignArtifact), 'utf8')) as { test_cases: Array<Record<string, unknown>> };
    for (const gap of workerTargets) {
      const testCase = design.test_cases.find((candidate) => candidate.id === gap.test_case_id);
      if (!testCase) continue;
      const requestPath = `artifacts/automation/${featureName}/${gap.test_case_id}.request.json`;
      const logPath = `artifacts/automation/${featureName}/${gap.test_case_id}.codex.log`;
      createAutomationRequest({ feature: featureName, testCase: testCase as never, plan: null, gap, outputPath: testFile, requestPath });
      let validation: GeneratedSpecValidation = {
        workerSucceeded: false,
        expectedTestFile: testFile,
        specExists: false,
        correspondsToTestCase: false,
        typescriptValid: false,
        semanticCoverageComplete: false,
        generatedSpecValid: false,
      };
      try {
        runCodexAutomation({ requestPath, outputPath: testFile, logPath });
        const specPath = resolveArtifactPath(projectRoot, testFile);
        const source = existsSync(specPath) ? readFileSync(specPath, 'utf8') : '';
        let typescriptValid = false;
        try {
          execFileSync(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['tsc', '--noEmit'], { cwd: projectRoot, stdio: 'ignore' });
          typescriptValid = true;
        } catch { /* Reconciliation keeps the case unautomated when validation fails. */ }
        validation = {
          workerSucceeded: true,
          expectedTestFile: testFile,
          specExists: existsSync(specPath),
          correspondsToTestCase: source.includes(gap.test_case_id),
          typescriptValid,
          semanticCoverageComplete: source.includes(String(testCase.title ?? '')) && source.includes('test('),
          generatedSpecValid: source.includes("from '../fixtures/test.fixture.js'") && !source.includes('Unsupported capability'),
        };
        result = reconcileAutomationResult(result, gap.test_case_id, validation);
      } catch (error) {
        result = reconcileAutomationResult(result, gap.test_case_id, validation);
        const current = result.test_cases.find((item) => item.test_case_id === gap.test_case_id);
        if (current && current.automation_status === 'not_automated') current.reason = `${gap.reason ?? 'unsupported'}; codex_worker_failed: ${error instanceof Error ? error.message : String(error)}`;
      }
    }
    result.codex_invoked = true;
    result.codex_reason = gaps.map((gap) => gap.reason).filter(Boolean).join('; ');
    writeFileSync(resolveArtifactPath(projectRoot, automationArtifact), `${JSON.stringify(result, null, 2)}\n`, 'utf8');
  }

  if (
    result.summary.total === 0
  ) {
    throw new Error(
      'Automation Agent produced no test cases.',
    );
  }

  if (
    !artifactExists(
      projectRoot,
      automationArtifact,
    )
  ) {
    throw new Error(
      `Automation artifact does not exist: ${automationArtifact}`,
    );
  }

  registerArtifact(
    projectRoot,
    stage,
    automationArtifact,
  );

  const registryPath = resolveArtifactPath(projectRoot, 'artifacts/automation/test-registry.json');
  mkdirSync(resolve(registryPath, '..'), { recursive: true });
  const registry = artifactExists(projectRoot, 'artifacts/automation/test-registry.json')
    ? JSON.parse(readFileSync(registryPath, 'utf8')) as { tests: unknown[] }
    : { tests: [] };
  const classification = result.classification;
  for (const item of result.test_cases) {
    const entry = { test_case_id: item.test_case_id, feature_id: featureName, spec: item.test_file, functional_area: classification?.functional_area ?? featureName, related_areas: classification?.related_areas ?? [], suites: classification?.suites ?? [], tags: classification?.tags ?? [], status: item.automation_status === 'automated' ? 'active' : 'not_automated' };
    registry.tests = registry.tests.filter((existing) => (existing as { test_case_id?: string }).test_case_id !== item.test_case_id);
    registry.tests.push(entry);
  }
  writeFileSync(registryPath, `${JSON.stringify(registry, null, 2)}\n`, 'utf8');
  registerArtifact(projectRoot, stage, 'artifacts/automation/test-registry.json');

  stage.status = 'completed';

  stage.completed_at = now();

  persistState(
    state,
    statePath,
  );
}

function runExecutionStage(
  state: WorkflowState,
  statePath: string,
): void {
  const stage =
    state.stages.execution;

  const testResultsDirectory =
    'test-results';

  const playwrightReportDirectory =
    'artifacts/playwright-report';
  const featureName = featureNameForState(state);
  const testFile = `tests/${featureName}.spec.ts`;

  state.status = 'running';

  state.current_stage =
    'execution';

  stage.status = 'running';

  stage.started_at = now();

  stage.completed_at = null;

  stage.error = null;

  persistState(
    state,
    statePath,
  );

  const automation = JSON.parse(readFileSync(resolveArtifactPath(projectRoot, `artifacts/automation/${featureName}.automation.json`), 'utf8')) as { summary?: { automated?: number } };
  if ((automation.summary?.automated ?? 0) === 0) {
    stage.status = 'skipped';
    stage.completed_at = now();
    stage.error = 'No automated test cases were available.';
    persistState(state, statePath);
    return;
  }

  let executionExitCode = 0;

  try {
    execFileSync(
      process.platform === 'win32'
        ? 'npx.cmd'
        : 'npx',

      [
        'playwright',
        'test',
        testFile,
      ],

      {
        cwd: projectRoot,
        stdio: 'inherit',
        env: { ...process.env, PLAYWRIGHT_JSON_OUTPUT_FILE: resolve(projectRoot, `artifacts/playwright-report/${featureName}.results.json`) },
      },
    );
  } catch {
    executionExitCode = 1;

    console.log(
      'Playwright execution finished with test failures.',
    );
  }

  if (
    artifactExists(
      projectRoot,
      testResultsDirectory,
    )
  ) {
    registerArtifact(
      projectRoot,
      stage,
      testResultsDirectory,
    );
  }

  if (
    artifactExists(
      projectRoot,
      playwrightReportDirectory,
    )
  ) {
    registerArtifact(
      projectRoot,
      stage,
      playwrightReportDirectory,
    );
  }

  stage.status = 'completed';

  stage.completed_at = now();

  persistState(
    state,
    statePath,
  );

  if (
    executionExitCode !== 0
  ) {
    console.log(
      'Execution completed with failed Playwright tests. Analysis will classify the result.',
    );
  }
}

function runAnalysisStage(
  state: WorkflowState,
  statePath: string,
): void {
  const stage =
    state.stages.analysis;

  const analysisDirectory =
    `artifacts/analysis/${featureNameForState(state)}`;

  state.status = 'running';

  state.current_stage =
    'analysis';

  stage.status = 'running';

  stage.started_at = now();

  stage.completed_at = null;

  stage.error = null;

  persistState(
    state,
    statePath,
  );

  if (state.stages.execution.status === 'skipped') {
    stage.status = 'skipped';
    stage.completed_at = now();
    stage.error = 'Execution was skipped because no automated test cases were available.';
    persistState(state, statePath);
    return;
  }

  /*
   * Analysis consumes the artifacts
   * generated by Execution.
   */

  execFileSync(
    process.platform === 'win32'
      ? 'npx.cmd'
      : 'npx',

    [
      'tsx',
      'scripts/run-analysis.ts',
      '--feature',
      featureNameForState(state),
      '--test-cases',
      `contracts/${featureNameForState(state)}.test-cases.json`,
      '--automation',
      `artifacts/automation/${featureNameForState(state)}.automation.json`,
    ],

    {
      cwd: projectRoot,
      stdio: 'inherit',
    },
  );

  if (
    !artifactExists(
      projectRoot,
      analysisDirectory,
    )
  ) {
    throw new Error(
      `Analysis artifact directory does not exist: ${analysisDirectory}`,
    );
  }

  registerArtifact(
    projectRoot,
    stage,
    analysisDirectory,
  );

  stage.status = 'completed';

  stage.completed_at = now();

  persistState(
    state,
    statePath,
  );
}

function runReportStage(
  state: WorkflowState,
  statePath: string,
): void {
  const stage =
    state.stages.report;

  const featureName = featureNameForState(state);
  const reportArtifact =
    `artifacts/reports/${featureName}.report.json`;

  state.status = 'running';

  state.current_stage =
    'report';

  stage.status = 'running';

  stage.started_at = now();

  stage.completed_at = null;

  stage.error = null;

  persistState(
    state,
    statePath,
  );

  /*
   * Report consumes the artifacts generated
   * by the previous workflow stages.
   */

  execFileSync(
    process.platform === 'win32'
      ? 'npx.cmd'
      : 'npx',

    [
      'tsx',
      'scripts/run-report.ts',
      '--feature',
      featureName,
      '--test-cases',
      `contracts/${featureName}.test-cases.json`,
      '--automation',
      `artifacts/automation/${featureName}.automation.json`,
      '--analysis',
      `artifacts/analysis/${featureName}`,
      '--exploratory',
      `artifacts/exploratory/${featureName}`,
      '--output',
      reportArtifact,
    ],

    {
      cwd: projectRoot,
      stdio: 'inherit',
    },
  );

  if (
    !artifactExists(
      projectRoot,
      reportArtifact,
    )
  ) {
    throw new Error(
      `Report artifact does not exist: ${reportArtifact}`,
    );
  }

  registerArtifact(
    projectRoot,
    stage,
    reportArtifact,
  );

  stage.status = 'completed';

  stage.completed_at = now();

  persistState(
    state,
    statePath,
  );
}

export function runWorkflow(
  featurePath: string,
  resumeStatePath?: string,
): {
  state: WorkflowState;
  statePath: string;
} {
  const resumed = Boolean(resumeStatePath);
  const state = resumed
    ? JSON.parse(readFileSync(resolve(projectRoot, resumeStatePath!), 'utf8')) as WorkflowState
    : createWorkflowState(featurePath);

  const workflowsPath =
    resolveArtifactPath(
      projectRoot,
      workflowsDirectory,
    );

  mkdirSync(
    workflowsPath,
    {
      recursive: true,
    },
  );

  const statePath = resumed
    ? resolve(projectRoot, resumeStatePath!)
    : resolve(workflowsPath, `${state.workflow_id}.json`);

  persistState(
    state,
    statePath,
  );

  try {
    const resumeIndex = resumed ? workflowStages.indexOf(state.resume_from_stage ?? 'test_design') : 0;
    for (const stageName of workflowStages.slice(resumeIndex)) {
      if (
        stageName === 'discovery'
      ) {
        runDiscoveryStage(
          state,
          statePath,
        );

        continue;
      }

      if (
        stageName === 'test_design'
      ) {
        if (runTestDesignStage(
          state,
          statePath,
          resumed,
        )) return { state, statePath: pathForState(statePath) };

        continue;
      }

      if (
        stageName === 'exploratory'
      ) {
        runExploratoryStage(
          state,
          statePath,
        );

        continue;
      }

      if (
        stageName === 'automation'
      ) {
        runAutomationStage(
          state,
          statePath,
        );

        continue;
      }

      if (
        stageName === 'execution'
      ) {
        runExecutionStage(
          state,
          statePath,
        );

        continue;
      }

      if (
        stageName === 'analysis'
      ) {
        runAnalysisStage(
          state,
          statePath,
        );

        continue;
      }

      if (
        stageName === 'report'
      ) {
        runReportStage(
          state,
          statePath,
        );

        continue;
      }

      runPlaceholderStage(
        state,
        stageName,
        statePath,
      );
    }

    const allStagesCompleted =
      workflowStages.every(
        (stageName) =>
          ['completed', 'skipped'].includes(state.stages[stageName].status),
      );

    if (
      !allStagesCompleted
    ) {
      throw new Error(
        'Workflow cannot complete because one or more stages are incomplete.',
      );
    }

      state.status = 'completed';
      state.resume_from_stage = null;

    persistState(
      state,
      statePath,
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : String(error);

    state.status = 'failed';

    if (
      state.current_stage
    ) {
      const currentStage =
        state.stages[
          state.current_stage
        ];

      currentStage.status =
        'failed';

      currentStage.completed_at =
        now();

      currentStage.error =
        message;
    }

    persistState(
      state,
      statePath,
    );

    console.error(
      `Workflow failed: ${message}`,
    );
  }

  return {
    state,

    statePath:
      pathForState(
        statePath,
      ),
  };
}

function readFeatureArgument(
  args: string[],
): string {
  const featureIndex =
    args.indexOf('--feature');

  const featurePath =
    featureIndex >= 0
      ? args[
          featureIndex + 1
        ]
      : undefined;

  if (
    !featurePath ||
    featurePath.startsWith('--')
  ) {
    throw new Error(
      'Usage: npm run qa:workflow -- --feature <feature-path>',
    );
  }

  return featurePath;
}

function readResumeArgument(args: string[]): string | undefined {
  const index = args.indexOf('--resume');
  const value = index >= 0 ? args[index + 1] : undefined;
  if (index >= 0 && (!value || value.startsWith('--'))) throw new Error('Usage: npx tsx orchestrator/workflow.ts --resume <workflow-state>');
  return value;
}

function printWorkflowSummary(
  state: WorkflowState,
  statePath: string,
): void {
  console.log(
    `workflow id: ${state.workflow_id}`,
  );

  console.log(
    `feature: ${state.feature}`,
  );

  console.log(
    `final status: ${state.status}`,
  );

  for (
    const stageName of workflowStages
  ) {
    const stage =
      state.stages[
        stageName
      ];

    const artifacts =
      stage.artifacts.length > 0
        ? ` [${stage.artifacts.join(', ')}]`
        : '';

    console.log(
      `${stageName}: ${stage.status}${artifacts}`,
    );
  }

  console.log(
    `state artifact path: ${statePath}`,
  );
}

function main(): void {
  try {
    const args = process.argv.slice(2);
    const resumePath = readResumeArgument(args);
    const featurePath = resumePath ? '' : readFeatureArgument(args);

    const {
      state,
      statePath,
    } = runWorkflow(featurePath, resumePath);

    printWorkflowSummary(
      state,
      statePath,
    );

    if (state.status === 'failed') {
      process.exitCode = 1;
    }
  } catch (error) {
    console.error(
      error instanceof Error
        ? error.message
        : String(error),
    );

    process.exitCode = 1;
  }
}

if (
  process.argv[1] &&
  /orchestrator[\\/]+workflow\.ts$/.test(
    process.argv[1],
  )
) {
  main();
}
