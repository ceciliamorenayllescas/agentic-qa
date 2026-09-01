import { existsSync } from 'node:fs';
import { relative, resolve } from 'node:path';

import type { WorkflowStageState } from './state.js';

export function resolveArtifactPath(projectRoot: string, artifactPath: string): string {
  return resolve(projectRoot, artifactPath);
}

export function artifactExists(projectRoot: string, artifactPath: string): boolean {
  return existsSync(resolveArtifactPath(projectRoot, artifactPath));
}

export function registerArtifact(projectRoot: string, stage: WorkflowStageState, artifactPath: string): void {
  const statePath = relative(projectRoot, resolveArtifactPath(projectRoot, artifactPath)) || '.';

  if (!stage.artifacts.includes(statePath)) {
    stage.artifacts.push(statePath);
  }
}
