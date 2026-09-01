import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();

export interface TestDesignRequestOptions {
  featurePath: string;
  discoveryPath: string;
  exploratoryDirectory: string;
  outputPath: string;
  testDesignArtifactPath: string;
  mode?: 'codex_cli' | 'codex_checkpoint';
}

export interface TestDesignValidationResult {
  feature: string;
  test_cases: Array<Record<string, unknown>>;
  metadata?: Record<string, unknown>;
}

const genericExpectedResult = /^(the observable outcome|the specified observable outcome|expected behavior occurs|works correctly|operation succeeds|the operation succeeds|the outcome is achieved)/i;

function text(path: string): string {
  return readFileSync(resolve(root, path), 'utf8');
}

function yamlValue(source: string, name: string): string {
  return source.match(new RegExp(`^\\s*${name}:\\s*[>]?\\s*(.+)$`, 'mi'))?.[1]?.trim().replace(/^['"]|['"]$/g, '') ?? '';
}

function listAfter(source: string, heading: string): string[] {
  const lines = source.replace(/\r/g, '').split('\n');
  const start = lines.findIndex((line) => new RegExp(`^\\s*${heading}:`).test(line));
  if (start < 0) return [];
  const baseIndent = lines[start].search(/\S|$/);
  const values: string[] = [];
  for (const line of lines.slice(start + 1)) {
    const indent = line.search(/\S|$/);
    if (line.trim() && indent <= baseIndent) break;
    const match = line.match(/^\s+-\s+(?:id:\s*)?(.+)$/);
    if (match) values.push(match[1].trim().replace(/^['"]|['"]$/g, ''));
  }
  return values.slice(0, 20);
}

/**
 * Return IDs declared by the Discovery contract in document order.
 *
 * Discovery is a black-box contract, so traceability must be grounded in its
 * declared IDs instead of a hardcoded set of ID prefixes. This deliberately
 * reads only `id:` declarations; references such as `traces_to` do not create
 * new IDs.
 */
export function discoveryIds(source: string): string[] {
  const ids: string[] = [];
  const seen = new Set<string>();
  const idDeclaration = /^\s*(?:-\s*)?id:\s*(['"]?)([A-Za-z0-9][A-Za-z0-9_-]*)\1\s*(?:#.*)?$/gmi;
  for (const match of source.matchAll(idDeclaration)) {
    const id = match[2];
    if (!seen.has(id)) {
      seen.add(id);
      ids.push(id);
    }
  }
  return ids;
}

function compactFinding(path: string): Record<string, unknown> {
  const finding = JSON.parse(text(path)) as Record<string, unknown>;
  const keep = ['id', 'title', 'type', 'status', 'description', 'expected', 'actual', 'expected_or_reference', 'observed_behavior', 'risk', 'steps_to_reproduce'];
  return Object.fromEntries(keep.filter((key) => finding[key] !== undefined).map((key) => [key, finding[key]]));
}

export function createTestDesignRequest(options: TestDesignRequestOptions): void {
  const feature = text(options.featurePath);
  const discovery = text(options.discoveryPath);
  const allowedTraceabilityIds = discoveryIds(discovery);
  const exploratoryAbsolute = resolve(root, options.exploratoryDirectory);
  const sessionPath = `${options.exploratoryDirectory}/exploration-session.json`;
  let session: Record<string, unknown> | null = null;
  let findings: Record<string, unknown>[] = [];
  if (existsSync(resolve(root, sessionPath))) {
    try { session = JSON.parse(text(sessionPath)) as Record<string, unknown>; } catch { session = { exploratory_status: 'failed', error: 'Invalid exploration-session.json' }; }
    if (session?.exploratory_status === 'executed' && existsSync(exploratoryAbsolute)) {
      findings = readdirSync(exploratoryAbsolute).filter((file) => /^EXP-.*\.json$/i.test(file)).map((file) => compactFinding(`${options.exploratoryDirectory}/${file}`));
    }
  }
  const request = {
    schema_version: '1.0',
    status: 'awaiting_codex',
    mode: options.mode ?? 'codex_checkpoint',
    resume_from_stage: 'test_design',
    output_artifact: options.testDesignArtifactPath,
    input_artifacts: {
      feature: options.featurePath,
      discovery: options.discoveryPath,
      exploratory_session: existsSync(resolve(root, sessionPath)) ? sessionPath : null,
      exploratory_findings: findings.map((finding) => `${options.exploratoryDirectory}/${String(finding.id)}.json`),
    },
    feature_summary: {
      id: yamlValue(feature, 'id'),
      name: yamlValue(feature, 'name'),
      description: yamlValue(feature, 'description'),
      objective: yamlValue(feature, 'objective'),
      include: listAfter(feature, 'include'),
      exclude: listAfter(feature, 'exclude'),
    },
    discovery_summary: {
      feature: yamlValue(discovery, 'feature'),
      intent: yamlValue(discovery, 'statement'),
      requirements: listAfter(discovery, 'requirements'),
      scenarios: listAfter(discovery, 'scenarios'),
      risks: listAfter(discovery, 'risks'),
      unknowns: listAfter(discovery, 'unknowns'),
    },
    allowed_traceability_ids: allowedTraceabilityIds,
    exploratory_summary: {
      status: session?.exploratory_status ?? 'not_available',
      charters_executed: session?.charters_executed ?? 0,
      findings_generated: session?.findings_generated ?? findings.length,
      findings,
    },
    instructions: [
      'Design a small set of semantic, reproducible test cases using PROVIDED and OBSERVED evidence.',
      'Prefer OBSERVED over INFERRED; keep UNKNOWN behavior unknown and do not invent requirements or backend behavior.',
      'Use concrete observable expected results; do not generate Playwright code or selectors.',
      'Express retained runtime reference data when later steps compare values.',
      'Traceability is grounded in the Discovery contract only: traceability MUST contain only values from allowed_traceability_ids in this request.',
      'Copy traceability IDs exactly as listed. Do not invent prefixes, normalize, transform, or otherwise alter IDs.',
      'If no appropriate ID exists for a relationship, leave that relationship untraced; do not invent an ID.',
      'Return only JSON compatible with contracts/test-cases.schema.json.',
    ],
  };
  const output = resolve(root, options.outputPath);
  mkdirSync(resolve(output, '..'), { recursive: true });
  writeFileSync(output, `${JSON.stringify(request, null, 2)}\n`, 'utf8');
}

function fail(message: string): never { throw new Error(`Test Design validation failed: ${message}`); }

export function validateTestDesignArtifact(path: string, discoveryPath: string, exploratoryDirectory?: string): TestDesignValidationResult {
  if (!existsSync(resolve(root, path))) throw new Error(`Test Design artifact does not exist: ${path}`);
  let value: unknown;
  try { value = JSON.parse(text(path)); } catch { fail('artifact is not valid JSON.'); }
  if (!value || typeof value !== 'object') fail('root must be an object.');
  const data = value as Record<string, unknown>;
  if (typeof data.feature !== 'string' || !Array.isArray(data.test_cases) || !Array.isArray(data.not_designed_as_deterministic_cases)) fail('root must contain feature, test_cases and not_designed_as_deterministic_cases.');
  const rootKeys = new Set(['feature', 'test_cases', 'not_designed_as_deterministic_cases', 'test_design_metadata']);
  if (Object.keys(data).some((key) => !rootKeys.has(key))) fail('root contains properties outside test-cases.schema.json.');
  for (const [index, item] of data.not_designed_as_deterministic_cases.entries()) {
    if (!item || typeof item !== 'object' || typeof (item as Record<string, unknown>).scenario_id !== 'string' || typeof (item as Record<string, unknown>).reason !== 'string') fail(`not_designed_as_deterministic_cases[${index}] must contain scenario_id and reason strings.`);
  }
  const discovery = text(discoveryPath);
  const knownIds = new Set(discoveryIds(discovery));
  if (exploratoryDirectory && existsSync(resolve(root, exploratoryDirectory))) for (const file of readdirSync(resolve(root, exploratoryDirectory))) if (/^EXP-.*\.json$/i.test(file)) knownIds.add(file.replace(/\.json$/i, ''));
  const seen = new Set<string>();
  const allowedTypes = new Set(['positive', 'negative', 'boundary', 'validation', 'permission', 'error_handling', 'regression', 'exploratory']);
  const allowedPriorities = new Set(['critical', 'high', 'medium', 'low']);
  for (const [index, item] of data.test_cases.entries()) {
    if (!item || typeof item !== 'object') fail(`test_cases[${index}] must be an object.`);
    const testCase = item as Record<string, unknown>;
    for (const key of ['id', 'title', 'type', 'priority', 'preconditions', 'steps', 'expected_results']) if (typeof testCase[key] === 'undefined') fail(`test_cases[${index}] is missing ${key}.`);
    if (typeof testCase.id !== 'string' || seen.has(testCase.id)) fail(`test_cases[${index}] has a missing or duplicate id.`);
    seen.add(String(testCase.id));
    if (typeof testCase.title !== 'string' || !testCase.title.trim() || testCase.title.length > 140 || (testCase.title.includes(' | ') && testCase.title.split(' | ').length > 2)) fail(`test_cases[${index}] has an invalid or concatenated title.`);
    if (typeof testCase.type !== 'string' || !allowedTypes.has(testCase.type)) fail(`test_cases[${index}] has an invalid type.`);
    if (typeof testCase.priority !== 'string' || !allowedPriorities.has(testCase.priority)) fail(`test_cases[${index}] has an invalid priority.`);
    if (!Array.isArray(testCase.preconditions) || !Array.isArray(testCase.steps) || !Array.isArray(testCase.expected_results) || testCase.steps.length === 0 || testCase.expected_results.length === 0) fail(`test_cases[${index}] must have non-empty preconditions, steps and expected_results.`);
    for (const field of ['preconditions', 'expected_results', 'traceability', 'test_data_requirements']) if (testCase[field] !== undefined && (!Array.isArray(testCase[field]) || (testCase[field] as unknown[]).some((item) => typeof item !== 'string' || !String(item).trim()))) fail(`test_cases[${index}].${field} must be an array of non-empty strings.`);
    for (const [stepIndex, step] of testCase.steps.entries()) {
      if (!step || typeof step !== 'object' || typeof (step as Record<string, unknown>).action !== 'string' || typeof (step as Record<string, unknown>).expected_result !== 'string') fail(`test_cases[${index}].steps[${stepIndex}] needs action and expected_result.`);
      const stepKeys = new Set(['action', 'expected_result', 'operation', 'selector', 'value', 'variable', 'value_type', 'collection', 'order']);
      if (Object.keys(step as object).some((key) => !stepKeys.has(key))) fail(`test_cases[${index}].steps[${stepIndex}] contains properties outside test-case.schema.json.`);
      const expected = String((step as Record<string, unknown>).expected_result);
      if (genericExpectedResult.test(expected.trim())) fail(`test_cases[${index}].steps[${stepIndex}] contains a generic expected result.`);
    }
    for (const expected of testCase.expected_results) if (typeof expected !== 'string' || genericExpectedResult.test(expected.trim())) fail(`test_cases[${index}] contains a generic expected result.`);
    if (Array.isArray(testCase.traceability)) for (const trace of testCase.traceability) if (typeof trace !== 'string' || !knownIds.has(trace)) fail(`test_cases[${index}] has unknown traceability id: ${String(trace)}.`);
  }
  return { feature: data.feature, test_cases: data.test_cases as Array<Record<string, unknown>>, metadata: data.test_design_metadata as Record<string, unknown> | undefined };
}
