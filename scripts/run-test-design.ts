import { existsSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const projectRoot = process.cwd();
function argumentValue(args: string[], name: string): string { const index = args.indexOf(name); const value = index >= 0 ? args[index + 1] : undefined; if (!value || value.startsWith('--')) throw new Error('Usage: npx tsx scripts/run-test-design.ts --discovery <path> --output <path>'); return value; }

interface Scenario { id: string; type: string; priority: string; statement: string; traces: string[]; }
function field(block: string, name: string): string { return block.match(new RegExp(`^[ \\t]+${name}:[ \\t]*(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '') ?? ''; }
function scenariosFrom(discovery: string): Scenario[] {
  const normalized = discovery.replace(/\r\n/g, '\n');
  const start = normalized.indexOf('scenarios:\n');
  const end = normalized.indexOf('\ndata_considerations:', start);
  const section = start >= 0 ? normalized.slice(start + 'scenarios:\n'.length, end >= 0 ? end : normalized.length) : '';
  return section.split(/\r?\n(?=  - id: SC-)/).filter(Boolean).map((block) => {
    const id = block.match(/^  - id: ([^\r\n]+)/)?.[1]?.trim() ?? '';
    return { id, type: field(block, 'type') || 'positive', priority: field(block, 'priority') || 'medium', statement: field(block, 'statement'), traces: (block.match(/^\s+traces_to:\s*\[([^\]]*)\]/m)?.[1] ?? '').split(',').map((item) => item.trim()).filter(Boolean) };
  }).filter((scenario) => scenario.statement);
}

function stepsFor(scenario: Scenario): Array<{ action: string; expected_result: string }> {
  const statement = scenario.statement;
  if (/sort|orden/i.test(statement)) return [
    { action: statement, expected_result: 'The collection is displayed in the specified order.' },
    { action: 'Observe the resulting collection and compare it with the requested ordering rule.', expected_result: 'The observed collection follows the requested ordering rule.' },
  ];
  if (/login|autentic|sesi[oó]n/i.test(statement)) return [
    { action: 'Provide the credentials and submit the authentication form.', expected_result: 'The application shows the authenticated state described by the feature.' },
    { action: 'Observe the destination and authenticated indicators.', expected_result: 'The specified destination and authenticated state are visible.' },
  ];
  if (/logout|cierre/i.test(statement)) return [
    { action: 'Perform the sign-out action from the authenticated state.', expected_result: 'The application ends the authenticated state without an observable error.' },
    { action: 'Observe the resulting screen and attempt the protected entry if specified.', expected_result: 'The application shows the specified unauthenticated state.' },
  ];
  if (statement.includes(' | ')) return statement.split(' | ').map((action) => ({ action, expected_result: 'The observable outcome for this flow step is achieved.' }));
  return [{ action: statement, expected_result: 'The observable outcome described by the scenario is achieved.' }];
}

function buildCases(discovery: string, feature: string, prefix: string): unknown[] {
  const scenarios = scenariosFrom(discovery).filter((scenario) => scenario.type !== 'exploratory');
  if (scenarios.length === 0) return [{ id: `TC-${prefix}-001`, title: `Validate ${feature} behavior`, type: 'positive', priority: 'medium', traceability: [], preconditions: ['The required test environment is available.'], test_data_requirements: [], steps: [{ action: feature, expected_result: 'The specified observable outcome is achieved.' }], expected_results: ['The specified observable outcome is achieved.'] }];
  return scenarios.map((scenario, index) => ({
    id: `TC-${prefix}-${String(index + 1).padStart(3, '0')}`,
    title: scenario.statement.charAt(0).toUpperCase() + scenario.statement.slice(1),
    type: scenario.type, priority: scenario.priority, traceability: scenario.traces,
    preconditions: ['The required test environment is available.', 'The initial user state required by the scenario is established.'],
    test_data_requirements: ['Use only values provided by the feature specification or observable in the application.'],
    steps: stepsFor(scenario), expected_results: stepsFor(scenario).map((step) => step.expected_result),
  }));
}

function main(): void {
  const args = process.argv.slice(2);
  const mode = process.env.TEST_DESIGN_MODE ?? (args.includes('--mode') ? argumentValue(args, '--mode') : '');
  if (mode !== 'deterministic') throw new Error('This legacy generator is available only with TEST_DESIGN_MODE=deterministic or --mode deterministic. Default workflow mode is codex_checkpoint.');
  const discoveryPath = resolve(projectRoot, argumentValue(args, '--discovery')); const outputPath = resolve(projectRoot, argumentValue(args, '--output'));
  if (!existsSync(discoveryPath)) throw new Error(`Discovery artifact does not exist: ${discoveryPath}`);
  const discovery = readFileSync(discoveryPath, 'utf8'); if (!discovery.trim()) throw new Error('Discovery artifact is empty.');
  if (!existsSync(outputPath) || args.includes('--regenerate')) {
    const feature = discovery.match(/^feature:\s+["']?(.+?)["']?\s*$/m)?.[1]?.replace(/^['"]|['"]$/g, '') ?? 'Feature';
    const featureId = discovery.match(/^id:\s+["']?(.+?)["']?\s*$/m)?.[1]?.replace(/^['"]|['"]$/g, '') ?? feature;
    const prefix = featureId.replace(/[^a-z0-9]/gi, '').slice(0, 8).toUpperCase() || 'FEATURE';
    const result = { feature, source: argumentValue(args, '--discovery'), test_cases: buildCases(discovery, feature, prefix), not_designed_as_deterministic_cases: scenariosFrom(discovery).filter((scenario) => scenario.type === 'exploratory').map((scenario) => ({ scenario_id: scenario.id, reason: 'Scenario is exploratory or its expected behavior remains undetermined.' })) };
    mkdirSync(resolve(outputPath, '..'), { recursive: true }); writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`, 'utf8'); console.log(`Test Design artifact generated: ${outputPath}`); return;
  }
  const content = readFileSync(outputPath, 'utf8'); if (!content.trim()) throw new Error('Test Design artifact is empty.'); JSON.parse(content); console.log('Test Design validation completed.'); console.log(`Input: ${discoveryPath}`); console.log(`Output: ${outputPath}`);
}
main();
