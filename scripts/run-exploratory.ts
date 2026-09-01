import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { runExploratoryAgent } from '../agents/exploratory/index.js';

const root = process.cwd();
function arg(args: string[], name: string, fallback?: string): string {
  const index = args.indexOf(name);
  const result = index >= 0 ? args[index + 1] : fallback;
  if (!result || result.startsWith('--')) throw new Error(`Usage: npx tsx scripts/run-exploratory.ts --feature <path> --discovery <path> [--test-cases <path>] --output <directory>`);
  return result;
}
function optionalArg(args: string[], name: string): string | undefined {
  const index = args.indexOf(name);
  if (index < 0) return undefined;
  const result = args[index + 1];
  if (!result || result.startsWith('--')) throw new Error(`Usage: npx tsx scripts/run-exploratory.ts --feature <path> --discovery <path> [--test-cases <path>] --output <directory>`);
  return result;
}
function validExistingEvidence(directory: string, featurePath: string, discoveryPath: string): boolean {
  const file = resolve(root, directory, 'exploration-session.json');
  if (!existsSync(file)) return false;
  try {
    const data = JSON.parse(readFileSync(file, 'utf8')) as { exploratory_status?: string; charters_executed?: number; feature_path?: string; discovery_path?: string };
    return ['executed', 'executed_with_gaps'].includes(data.exploratory_status ?? '') && (data.charters_executed ?? 0) > 0 && data.feature_path === featurePath && data.discovery_path === discoveryPath;
  } catch { return false; }
}
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const featurePath = arg(args, '--feature');
  const discoveryPath = arg(args, '--discovery');
  const testCasesPath = optionalArg(args, '--test-cases');
  const defaultOutput = `artifacts/exploratory/${featurePath.replace(/.*[\\/]/, '').replace(/\.[^.]+$/, '')}`;
  const outputDirectory = arg(args, '--output', defaultOutput);
  for (const path of [featurePath, discoveryPath]) if (!existsSync(resolve(root, path))) throw new Error(`Exploratory input does not exist: ${path}`);
  if (testCasesPath && !existsSync(resolve(root, testCasesPath))) throw new Error(`Exploratory input does not exist: ${testCasesPath}`);
  mkdirSync(resolve(root, outputDirectory), { recursive: true });
  if (process.env.REUSE_EXPLORATORY === 'true' && validExistingEvidence(outputDirectory, featurePath, discoveryPath)) {
    const session = JSON.parse(readFileSync(resolve(root, outputDirectory, 'exploration-session.json'), 'utf8')) as { charters_executed: number; findings_generated: number };
    console.log(`Exploratory reused valid evidence for ${featurePath}: charters=${session.charters_executed}, findings=${session.findings_generated}`);
    return;
  }
  console.log('Exploratory started (Playwright MCP-compatible browser session)');
  const result = await runExploratoryAgent({ featurePath, discoveryPath, testCasesPath, outputDirectory });
  console.log(`Charters executed: ${result.charters_executed}`);
  console.log(`Findings generated: ${result.findings_generated}`);
  console.log(`Evidence captured: ${result.evidence.length}`);
  console.log('Exploratory completed');
}
main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  const args = process.argv.slice(2);
  const output = args.indexOf('--output') >= 0 ? args[args.indexOf('--output') + 1] : undefined;
  if (output && output !== '--output') {
    mkdirSync(resolve(root, output), { recursive: true });
    writeFileSync(resolve(root, output, 'exploration-session.json'), `${JSON.stringify({ exploratory_status: 'failed', charters_executed: 0, findings_generated: 0, started_at: new Date().toISOString(), completed_at: new Date().toISOString(), error: message }, null, 2)}\n`, 'utf8');
  }
  console.error(`Exploratory failed: ${message}`);
  process.exitCode = 1;
});
