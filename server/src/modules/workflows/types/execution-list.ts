import { WorkflowExecution } from '@entities/workflow_execution.entity';

export const EXECUTION_LIST_SORTS = ['created_desc', 'created_asc'] as const;
export type ExecutionListSort = (typeof EXECUTION_LIST_SORTS)[number];

export interface ExecutionListFilters {
  statuses?: string[];
  /** One id or several. */
  appId?: string | string[];
  folderId?: string;
  /** One id or several. */
  environmentId?: string | string[];
  triggers?: string[];
  from?: string;
  to?: string;
  /** Defaults to `created_desc`. */
  sort?: ExecutionListSort;
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
  createdAt: string | null;
  version: { id: string; name: string } | null;
  environment: { id: string; name: string } | null;
  canStop?: boolean;
}

// Omit appVersion: required on the entity, but the decorated row may carry { id, name } or nothing.
export type ExecutionListRow = Omit<WorkflowExecution, 'appVersion'> & {
  app?: { id: string; name: string };
  appVersion?: {
    id: string;
    name: string;
    appName?: string | null;
    versionType?: string;
    branch?: { name: string } | null;
  };
  environment?: { id: string; name: string };
  schedule?: { id: string; name: string | null; type: string; details: Record<string, unknown> | null };
};
