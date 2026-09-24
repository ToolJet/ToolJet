import { WorkflowExecution } from '@entities/workflow_execution.entity';
import { WORKFLOW_TRIGGER_TYPE, WorkflowTriggerType } from './index';

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

// The decorated row the repository returns: a WorkflowExecution with the joined entities mapped on.
// Exclude appVersion (a required ManyToOne relation in the entity) before intersecting our narrowed
// optional shape; without this Omit, TypeScript resolves the property to still be required, even though
// the repository's leftJoinAndMapOne may populate only { id, name } or nothing at all.
export type ExecutionListRow = Omit<WorkflowExecution, 'appVersion'> & {
  app?: { id: string; name: string };
  appVersion?: { id: string; name: string };
  environment?: { id: string; name: string };
  schedule?: { id: string; name: string | null; details: unknown };
};

export const TRIGGER_TYPE_LABELS: Record<WorkflowTriggerType, string> = {
  [WORKFLOW_TRIGGER_TYPE.MANUAL]: 'Manual',
  [WORKFLOW_TRIGGER_TYPE.SCHEDULE]: 'Scheduled (Cron)',
  [WORKFLOW_TRIGGER_TYPE.WEBHOOK]: 'API Webhook',
  [WORKFLOW_TRIGGER_TYPE.APP]: 'Event',
  [WORKFLOW_TRIGGER_TYPE.WORKFLOW]: 'Sub-workflow',
  [WORKFLOW_TRIGGER_TYPE.UNKNOWN]: 'Unknown',
};
