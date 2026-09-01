import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const projectRoot = process.cwd();

export interface DiscoveryOptions { featurePath: string; outputPath: string; }

function valueAfter(text: string, pattern: RegExp): string | null {
  return text.match(pattern)?.[1]?.trim().replace(/^['"]|['"]$/g, '') ?? null;
}

function sectionList(text: string, heading: string): string[] {
  const match = text.match(new RegExp(`(?:^|\\n)\\s*${heading}:\\s*\\n([\\s\\S]*?)(?=\\n\\s*[a-zA-Z_]+:\\s*|$)`, 'i'));
  return [...(match?.[1] ?? '').matchAll(/^\s+-\s+(.+)$/gm)].map((item) => item[1].trim().replace(/^['"]|['"]$/g, ''));
}

function blockValue(text: string, heading: string): string | null {
  const match = text.match(new RegExp(`(?:^|\\n)\\s*${heading}:\\s*>\\s*\\n([\\s\\S]*?)(?=\\n\\s*\\S[^\\n]*:|$)`, 'i'));
  return match ? match[1].split(/\r?\n/).map((line) => line.trim()).filter(Boolean).join(' ') : null;
}

function yamlQuote(value: string): string { return JSON.stringify(value.replace(/\s+/g, ' ').trim()); }
function idPart(value: string): string { return value.replace(/[^a-z0-9]/gi, '').slice(0, 8).toUpperCase() || 'FEATURE'; }

function classification(statement: string): string {
  return /\b(should|must|can|pueda|debe|validar|verificar)\b/i.test(statement) ? 'provided' : 'inferred';
}

function deriveAreas(text: string, prefix: string): Array<{ id: string; name: string; coverage: string; rationale: string }> {
  const areas: Array<{ id: string; name: string; coverage: string; rationale: string }> = [];
  const add = (name: string, coverage: string, rationale: string) => areas.push({ id: `TA-${prefix}-${String(areas.length + 1).padStart(3, '0')}`, name, coverage, rationale });
  if (/sort|orden/i.test(text)) add('Functional behavior', 'Each specified ordering variant produces the requested observable sequence.', 'The specification names ordering variants.');
  if (/cart|checkout|pedido|compra/i.test(text)) add('State transition', 'The user moves through the specified purchase states and retains relevant selection state.', 'The specification describes a multi-step purchase flow.');
  if (/login|autentic|sesi[oó]n|logout|cierre/i.test(text)) add('Authentication state', 'The observable authenticated or unauthenticated state changes as specified.', 'The specification refers to authentication state.');
  if (/price|precio|quantity|cantidad|data|datos|product|producto/i.test(text)) add('Data handling', 'Visible product, price, quantity, or form data is preserved and represented consistently.', 'The specification names user or product data.');
  if (/redirect|redirec|pantalla|navigate|acceder|access/i.test(text)) add('Navigation', 'The user reaches the specified entry or destination state.', 'The specification refers to navigation or access.');
  return areas;
}

function deriveScenarios(text: string, requirements: string[], prefix: string): Array<{ id: string; area: string; type: string; priority: string; statement: string; traces: string[] }> {
  const scenarios: Array<{ id: string; area: string; type: string; priority: string; statement: string; traces: string[] }> = [];
  const add = (statement: string, areaIndex = 0, type = 'positive', priority = 'high', traces = requirements.map((_, i) => `RQ-${prefix}-${String(i + 1).padStart(3, '0')}`)) => scenarios.push({ id: `SC-${prefix}-${String(scenarios.length + 1).padStart(3, '0')}`, area: `TA-${prefix}-${String(Math.min(areaIndex + 1, 9)).padStart(3, '0')}`, type, priority, statement, traces });
  if (/(?:name|nombre)[^,;]*(?:a[- ]?z|a to z)/i.test(text)) add('Sort the collection by name ascending and observe the resulting order.');
  if (/(?:name|nombre)[^,;]*(?:z[- ]?a|z to a)/i.test(text)) add('Sort the collection by name descending and observe the resulting order.');
  if (/(?:price|precio)[^,;]*(?:low[- ]?high|low to high|menor a mayor)/i.test(text)) add('Sort the collection by price ascending and observe the resulting order.');
  if (/(?:price|precio)[^,;]*(?:high[- ]?low|high to low|mayor a menor)/i.test(text)) add('Sort the collection by price descending and observe the resulting order.');
  if (scenarios.length === 0) add(requirements.join(' | '), 0, 'positive', 'high');
  if (/change|cambiar|repeat|repet|multiple|varias|varios/i.test(text)) add('Change the selected behavior repeatedly and observe whether the resulting state remains consistent.', 0, 'regression', 'medium');
  return scenarios;
}

export function runDiscoveryAgent(options: DiscoveryOptions): void {
  const featurePath = resolve(projectRoot, options.featurePath);
  const outputPath = resolve(projectRoot, options.outputPath);
  if (!existsSync(featurePath)) throw new Error(`Feature file does not exist: ${featurePath}`);
  const source = readFileSync(featurePath, 'utf8');
  const id = valueAfter(source, /(?:^|\n)\s*id:\s*([^\n]+)/i) ?? options.outputPath.split(/[\\/]/).pop()?.replace(/\.discovery\.yaml$/, '') ?? 'feature';
  const name = valueAfter(source, /(?:^|\n)\s*name:\s*([^\n]+)/i) ?? id;
  const description = blockValue(source, 'objective') ?? blockValue(source, 'description') ?? 'Feature behavior is described by the supplied feature specification.';
  const acceptance = sectionList(source, 'acceptance_criteria');
  const include = sectionList(source, 'include');
  const requirements = acceptance.length > 0 ? acceptance : include.length > 0 ? include : [description];
  const exclude = sectionList(source, 'exclude').concat(sectionList(source, 'out'));
  const contextEnvironment = valueAfter(source, /(?:^|\n)\s*environment:\s*([^\n]+)/i);
  const contextRole = valueAfter(source, /(?:^|\n)\s*role:\s*([^\n]+)/i);
  const prefix = idPart(id);
  const text = [description, ...requirements].join(' ');
  const areas = deriveAreas(text, prefix);
  const scenarios = deriveScenarios(text, requirements, prefix);
  const lines = [
    `feature: ${yamlQuote(name)}`, `id: ${yamlQuote(id)}`, `source: ${yamlQuote(options.featurePath.replace(/\\/g, '/'))}`,
    'feature_intent:', `  statement: ${yamlQuote(description)}`, '  evidence: provided',
    'context:', ...(contextEnvironment ? [`  environment: ${yamlQuote(contextEnvironment)}`] : []), ...(contextRole ? [`  role: ${yamlQuote(contextRole)}`] : []),
    'preconditions:', '  - id: PRE-DISC-001', '    statement: The environment and any required user state described by the feature must be available.', '    evidence: inferred',
    'actors:', ...(contextRole ? [`  - name: ${yamlQuote(contextRole)}`, '    state: authenticated or otherwise as specified by the feature', '    evidence: provided'] : ['  - name: User', '    state: as specified by the feature', '    evidence: inferred']),
    'entry_points:', `  - ${yamlQuote('The user enters through the application flow described by the feature.')}`,
    'main_flow:', ...requirements.map((item, i) => `  - sequence: ${i + 1}\n    statement: ${yamlQuote(item)}\n    evidence: provided`),
    'observable_states:', '  - state: initial', '    evidence: inferred', '  - state: feature outcome described by the specification', '    evidence: provided',
    'state_transitions:', `  - from: initial\n    to: ${yamlQuote('feature outcome')}\n    trigger: ${yamlQuote('user performs the specified flow')}\n    evidence: inferred`,
    'business_rules_observable:', ...requirements.map((item, i) => `  - id: BR-${prefix}-${String(i + 1).padStart(3, '0')}\n    statement: ${yamlQuote(item)}\n    evidence: provided`),
    'observed: []', 'assumptions:', '  - id: ASM-DISC-001', '    statement: Runtime observations have not been added by this deterministic discovery run.', '    rationale: No live application evidence was supplied to Discovery.',
    'unknowns:', '  - id: UNK-DISC-001', '    statement: Which boundary values, invalid inputs, or recovery behaviors apply is not defined by the supplied specification.', '    evidence: unknown',
    ...( /sort|orden/i.test(text) ? ['  - id: UNK-DISC-002', '    statement: Whether string comparison is case-sensitive is not defined.', '    evidence: unknown', '  - id: UNK-DISC-003', '    statement: The behavior for an empty or single-item collection is not defined.', '    evidence: unknown'] : []),
    'test_areas:', ...areas.map((area) => `  - id: ${area.id}\n    name: ${yamlQuote(area.name)}\n    coverage: ${yamlQuote(area.coverage)}\n    rationale: ${yamlQuote(area.rationale)}`),
    'risks:', ...areas.map((area, i) => `  - id: RSK-${prefix}-${String(i + 1).padStart(3, '0')}\n    level: ${i === 0 ? 'high' : 'medium'}\n    area: ${area.id}\n    statement: ${yamlQuote('The ' + area.name.toLowerCase() + ' may contradict the specified outcome, which would affect ' + area.coverage.toLowerCase() + '.')}\n    test_focus: ${yamlQuote(area.name)}`),
    'scenarios:', ...scenarios.map((scenario) => `  - id: ${scenario.id}\n    area: ${scenario.area}\n    type: ${scenario.type}\n    priority: ${scenario.priority}\n    statement: ${yamlQuote(scenario.statement)}\n    traces_to: [${scenario.traces.join(', ')}]`),
    'data_considerations:', `  - ${yamlQuote(/price|precio/i.test(text) ? 'Visible numeric values may require normalization before comparison; the representation is not assumed.' : 'Use only data values supplied or observable through the feature flow.')}`,
    'dependencies:', `  - ${yamlQuote(contextEnvironment ? 'The ' + contextEnvironment + ' environment is named by the feature specification.' : 'The required application environment must be available.')}`,
    'out_of_scope:', ...(exclude.length ? exclude.map((item) => `  - ${yamlQuote(item)}`) : ['  - "No exclusions were provided by the specification."']),
    'exploratory_charters:', `  - id: EC-${prefix}-001`, `    mission: ${yamlQuote('Explore the highest-risk observable behavior of ' + name + ', including state consistency and specification boundaries.')}`, '    timebox_minutes: 15', `    focus: [${scenarios.map((s) => s.id).join(', ')}]`, '    note: Record observed behavior separately; inferred concerns and unknowns are not defects without evidence.',
    'requirements:', ...requirements.map((item, i) => `  - id: RQ-${prefix}-${String(i + 1).padStart(3, '0')}\n    statement: ${yamlQuote(item)}\n    evidence: provided`), '',
  ];
  mkdirSync(resolve(outputPath, '..'), { recursive: true });
  writeFileSync(outputPath, lines.join('\n'), 'utf8');
  console.log(`Discovery artifact generated: ${outputPath}`);
}

function argumentValue(args: string[], name: string): string {
  const index = args.indexOf(name);
  const value = index >= 0 ? args[index + 1] : undefined;
  if (!value || value.startsWith('--')) throw new Error('Usage: npx tsx agents/discovery/index.ts --feature <path> --output <path>');
  return value;
}

if (process.argv[1] && /agents[\\/]discovery[\\/]index\.ts$/.test(process.argv[1])) {
  const args = process.argv.slice(2);
  runDiscoveryAgent({ featurePath: argumentValue(args, '--feature'), outputPath: argumentValue(args, '--output') });
}
