import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { relative, resolve } from 'node:path';
import { capabilityRegistry } from './index.js';
import type { TestCaseForPlanning } from './plan.js';
import { resolveArtifactPath } from '../../orchestrator/artifacts.js';

const root = process.cwd();
const allowedRoots = ['agents/automation', 'pages', 'helpers', 'fixtures', 'tests', 'artifacts/automation'];

function executable(): string {
  for (const name of process.platform === 'win32' ? ['codex.cmd', 'codex.exe', 'codex'] : ['codex']) {
    const result = spawnSync(name, ['--version'], { cwd: root, stdio: 'ignore', windowsHide: true });
    if (result.status === 0) return name;
  }
  throw new Error('Codex CLI is unavailable for Automation.');
}

function allowed(path: string): boolean {
  const normalized = path.replaceAll('\\', '/');
  return allowedRoots.some((prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`));
}

function snapshotFiles(directory: string, result = new Map<string, string>()): Map<string, string> {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (['node_modules', '.git', 'test-results', 'playwright-report'].includes(entry.name)) continue;
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) snapshotFiles(path, result);
    else result.set(relative(root, path).replaceAll('\\', '/'), createHash('sha256').update(readFileSync(path)).digest('hex'));
  }
  return result;
}

function changedFiles(before: Map<string, string>): string[] {
  const after = snapshotFiles(root);
  return [...new Set([...before.keys(), ...after.keys()])].filter((file) => before.get(file) !== after.get(file));
}

function prompt(requestPath: string, outputPath: string): string {
  return [
    'You are the Automation Worker for Agentic-QA, operating at build time only.',
    `Read the request at ${requestPath}; inspect the referenced test case, planner gap, capability registry, Page Objects, helpers, fixtures and existing specs.`,
    `Produce or maintain the Playwright spec at ${outputPath} and any reusable automation infrastructure needed.`,
    'Reuse-first policy: existing capability, primitive, POM/helper, then extend a generic capability, then add a reusable capability only if necessary.',
    'Never create feature-specific functions, test-case conditionals, hardcoded product names, or dynamic AI behavior in tests.',
    'Use stable roles, labels, test ids and semantic locators. Do not use force, arbitrary waits, or nth selectors when a semantic alternative exists.',
    'Do not alter expected results to make a failing functional assertion pass. Preserve assertions.',
    'Allowed writes are only agents/automation, pages, helpers, fixtures, tests and the request/output artifacts under artifacts/automation.',
    'Do not modify Discovery, Test Design contracts, feature YAML, orchestrator core, package configuration or unrelated files.',
    'The generated test must run with Playwright only; do not import Codex, OpenAI, MCP or any LLM at runtime.',
    'Stop after the smallest reusable implementation and spec are written.',
  ].join('\n');
}

export function createAutomationRequest(options: { feature: string; testCase: TestCaseForPlanning; plan: unknown; gap: unknown; outputPath: string; requestPath: string }): void {
  const request = {
    schema_version: '1.0', feature: options.feature, test_case: options.testCase,
    normalized_steps: options.testCase.steps, automation_plan: options.plan, coverage: options.gap,
    available_capabilities: Object.keys(capabilityRegistry), runtime_variables: ['selectedProducts', 'selectedProductNames', 'cartProductNames', 'overviewProductNames'],
    allowed_read_paths: ['agents/automation', 'pages', 'helpers', 'fixtures', 'tests', 'contracts/test-case.schema.json', 'AGENTS.md'],
    allowed_write_paths: allowedRoots, output_spec: options.outputPath,
  };
  const path = resolveArtifactPath(root, options.requestPath); mkdirSync(resolve(path, '..'), { recursive: true });
  writeFileSync(path, `${JSON.stringify(request, null, 2)}\n`, 'utf8');
}

export interface CodexAutomationResult { invoked: boolean; logPath: string; changedFiles: string[]; }

export function runCodexAutomation(options: { requestPath: string; outputPath: string; logPath: string }): CodexAutomationResult {
  const before = snapshotFiles(root);
  const name = executable();
  const timeout = Number(process.env.CODEX_AUTOMATION_TIMEOUT_MS ?? 10 * 60 * 1000);
  if (!Number.isFinite(timeout) || timeout <= 0) throw new Error('CODEX_AUTOMATION_TIMEOUT_MS must be positive.');
  const child = spawnSync(name, ['exec', '--cd', root, '--sandbox', 'workspace-write', '--ephemeral', '--color', 'never', '-'], { cwd: root, input: prompt(options.requestPath, options.outputPath), encoding: 'utf8', timeout, windowsHide: true });
  const timedOut = child.error?.message.includes('ETIMEDOUT') ?? false;
  const changed = changedFiles(before);
  const log = resolveArtifactPath(root, options.logPath); mkdirSync(resolve(log, '..'), { recursive: true });
  writeFileSync(log, `command: ${name} exec --cd <project-root> --sandbox workspace-write --ephemeral --color never -\nexit_code: ${child.status ?? 'null'}\ntimed_out: ${timedOut}\nchanged_files: ${JSON.stringify(changed)}\noutput:\n${`${child.stdout ?? ''}\n${child.stderr ?? ''}`.trim().slice(-16000)}\n`, 'utf8');
  if (changed.some((file) => !allowed(file))) throw new Error(`Automation Worker modified a forbidden path: ${changed.find((file) => !allowed(file))}`);
  if (timedOut) throw new Error(`Codex Automation timed out after ${timeout} ms.`);
  if (child.error) throw new Error(`Codex Automation could not start: ${child.error.message}`);
  if (child.status !== 0) throw new Error(`Codex Automation failed with exit code ${child.status}.`);
  if (!existsSync(resolveArtifactPath(root, options.outputPath))) throw new Error(`Automation Worker did not produce ${options.outputPath}.`);
  return { invoked: true, logPath: options.logPath, changedFiles: changed };
}
