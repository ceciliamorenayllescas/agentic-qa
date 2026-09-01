export const workflowStages = [
  'discovery',
  'exploratory',
  'test_design',
  'automation',
  'execution',
  'analysis',
  'report',
] as const;

export const workflowStatuses = [
  'pending',
  'running',
  'paused',
  'completed',
  'failed',
  'skipped',
] as const;

export type WorkflowStageName = (typeof workflowStages)[number];
export type WorkflowStatus = (typeof workflowStatuses)[number];

export interface WorkflowStageState {
  status: WorkflowStatus;
  started_at: string | null;
  completed_at: string | null;
  artifacts: string[];
  error: string | null;
}

export type WorkflowStages = Record<WorkflowStageName, WorkflowStageState>;

export interface WorkflowState {
  schema_version: '1.0';
  workflow_id: string;
  feature: string;
  status: WorkflowStatus;
  current_stage: WorkflowStageName | null;
  created_at: string;
  updated_at: string;
  /** Stage from which a paused workflow must resume. Optional for legacy states. */
  resume_from_stage?: WorkflowStageName | null;
  stages: WorkflowStages;
}

export function createPendingStages(): WorkflowStages {
  const stages = {} as WorkflowStages;

  for (const stageName of workflowStages) {
    stages[stageName] = {
      status: 'pending',
      started_at: null,
      completed_at: null,
      artifacts: [],
      error: null,
    };
  }

  return stages;
}
