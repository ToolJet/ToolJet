import { WorkflowExecution } from '@entities/workflow_execution.entity';

export interface ExecutionListFilters {
  statuses?: string[];
  appId?: string;
  folderId?: string;
  environmentId?: string;
  triggers?: string[];
  from?: string;
  to?: string;
}

export interface ExecutionListItem {
  id: string;
  workflow: { id: string; name: string } | null;
  status: string | null;
  executed: boolean;
  triggerType: string;
  schedule: { id: string; name: string } | null;
  startedAt: string | null;
  finishedAt: string | null;
  createdAt: string;
  version: { id: string; name: string } | null;
  environment: { id: string; name: string } | null;
}

// Omit appVersion: required on the entity, but the decorated row may carry { id, name } or nothing.
export type ExecutionListRow = Omit<WorkflowExecution, 'appVersion'> & {
  app?: { id: string; name: string };
  appVersion?: { id: string; name: string };
  environment?: { id: string; name: string };
  schedule?: { id: string; name: string | null; type: string; details: Record<string, unknown> | null };
};
