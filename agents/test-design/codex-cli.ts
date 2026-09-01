import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { artifactExists, resolveArtifactPath } from '../../orchestrator/artifacts.js';

const projectRoot = process.cwd();
const defaultTimeoutMs = 10 * 60 * 1000;

export interface CodexCliResult {
  command: string;
  exitCode: number | null;
  timedOut: boolean;
  logPath: string;
}

function executableCandidates(): string[] {
  return process.platform === 'win32' ? ['codex.cmd', 'codex.exe', 'codex'] : ['codex'];
}

function findCodex(): string {
  for (const executable of executableCandidates()) {
    const result = spawnSync(executable, ['--version'], {
      cwd: projectRoot,
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: false,
      encoding: 'utf8',
      windowsHide: true,
    });
    if (result.status === 0) return executable;
  }
  throw new Error('Codex CLI no está disponible. Instale/configure Codex CLI fuera de este workflow o use TEST_DESIGN_MODE=codex_checkpoint.');
}

function promptFor(requestPath: string, outputPath: string): string {
  return [
    'You are the non-interactive Test Design worker for this repository.',
    `Read the compact request at ${requestPath}. Then read the referenced Feature, Discovery, Exploratory artifacts, AGENTS.md when useful, and contracts/test-cases.schema.json.`,
    `Generate exactly one artifact at ${outputPath}.`,
    'Requirements:',
    '- Obey contracts/test-cases.schema.json and all Test Design rules in AGENTS.md.',
    '- Use Feature, Discovery, and Exploratory evidence; prefer OBSERVED over INFERRED.',
    '- Do not invent requirements or backend behavior. Preserve unknowns.',
    '- Generate semantic test cases with concrete observable expected results.',
    '- Read the Discovery contract and identify the traceability IDs actually available there.',
    '- Traceability MUST contain only values from allowed_traceability_ids in the request.',
    '- Copy traceability IDs exactly as provided; do not invent prefixes, normalize, transform, or otherwise alter them.',
    '- If no appropriate ID exists for a relationship, do not invent one.',
    '- Preserve runtime dependencies where necessary and maintain grounded traceability.',
    '- Do not generate Playwright code or selectors.',
    '- Write ONLY the required Test Design artifact.',
    '- Do not modify agents/, orchestrator/, pages/, fixtures/, helpers/, scripts/, package.json, config/, automation, or tests.',
    '- Do not run the full workflow.',
    '- Stop after creating the artifact. Do not ask questions or wait for approval.',
  ].join('\n');
}

export function runCodexTestDesign(options: {
  requestPath: string;
  outputPath: string;
  logPath: string;
}): CodexCliResult {
  const executable = findCodex();
  const timeoutMs = Number(process.env.CODEX_TEST_DESIGN_TIMEOUT_MS ?? defaultTimeoutMs);
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) throw new Error('CODEX_TEST_DESIGN_TIMEOUT_MS debe ser un número positivo.');

  const args = ['exec', '--cd', projectRoot, '--sandbox', 'workspace-write', '--ephemeral', '--color', 'never', '-'];
  const child = spawnSync(executable, args, {
    cwd: projectRoot,
    shell: false,
    input: promptFor(options.requestPath, options.outputPath),
    encoding: 'utf8',
    timeout: timeoutMs,
    windowsHide: true,
  });
  const timedOut = child.error?.message.includes('ETIMEDOUT') ?? false;
  const logPath = resolveArtifactPath(projectRoot, options.logPath);
  mkdirSync(resolve(logPath, '..'), { recursive: true });
  const compact = `${child.stdout ?? ''}\n${child.stderr ?? ''}`.trim().slice(-16000);
  writeFileSync(logPath, `command: ${executable} exec --cd <project-root> --sandbox workspace-write --ephemeral --color never -\nexit_code: ${child.status ?? 'null'}\ntimed_out: ${timedOut}\noutput:\n${compact}\n`, 'utf8');
  if (child.error && !timedOut) throw new Error(`No se pudo ejecutar Codex CLI: ${child.error.message}. Puede utilizar TEST_DESIGN_MODE=codex_checkpoint.`);
  if (timedOut) throw new Error(`Codex CLI excedió CODEX_TEST_DESIGN_TIMEOUT_MS (${timeoutMs} ms). Consulte ${options.logPath}.`);
  if (child.status !== 0) throw new Error(`Codex CLI falló con exit code ${child.status}. Puede ser un error de autenticación, límite de uso o ejecución. Consulte ${options.logPath}.`);
  if (!artifactExists(projectRoot, options.outputPath)) throw new Error(`Codex CLI terminó correctamente pero no generó ${options.outputPath}. Consulte ${options.logPath}.`);
  return { command: `codex exec --cd <project-root> --sandbox workspace-write --ephemeral --color never -`, exitCode: child.status, timedOut, logPath: options.logPath };
}
