export enum FEATURE_KEY {
  EXECUTE_WORKFLOW = 'execute_workflow',
  WORKFLOW_EXECUTION_STATUS = 'workflow_execution_status',
  WORKFLOW_EXECUTION_DETAILS = 'workflow_execution_details',
  LIST_WORKFLOW_EXECUTIONS = 'list_workflow_executions',
  FETCH_EXECUTION_LOGS = 'fetch_execution_logs',
  FETCH_EXECUTION_NODES = 'fetch_execution_nodes',
  PREVIEW_QUERY_NODE = 'preview_query_node',

  CREATE_WORKFLOW_SCHEDULE = 'create_workflow_schedule',
  LIST_WORKFLOW_SCHEDULES = 'list_workflow_schedules',
  FIND_WORKFLOW_SCHEDULE = 'find_workflow_schedule',
  UPDATE_SCHEDULED_WORKFLOW = 'update_scheduled_workflow',
  ACTIVATE_SCHEDULED_WORKFLOW = 'activate_scheduled_workflow',
  REMOVE_SCHEDULED_WORKFLOW = 'remove_scheduled_workflow',

  WEBHOOK_TRIGGER_WORKFLOW = 'webhook_trigger_workflow',
  UPDATE_WORKFLOW_WEBHOOK_DETAILS = 'update_workflow_webhook_details',

  CREATE_WORKFLOW = 'create_workflow',
}

export const WORKFLOW_TRIGGER_TYPE = {
  MANUAL: 'manual',
  SCHEDULE: 'schedule',
  WEBHOOK: 'webhook',
} as const;

export type WorkflowTriggerType = typeof WORKFLOW_TRIGGER_TYPE[keyof typeof WORKFLOW_TRIGGER_TYPE];

export interface ExecutionMetadata {
  timeout: number;
  triggeredBy: WorkflowTriggerType;
  triggeredAt: Date;
  scheduleId?: string; // Optional, only present for scheduled workflows
}

export const WORKFLOW_SCHEDULE_QUEUE = 'workflow-schedule-queue';
export const WORKFLOW_EXECUTION_QUEUE = 'workflow-execution-queue';
export const SCHEDULE_JOB = 'workflow-scheduler-job';
export const EXECUTION_JOB = 'workflow-execution-job';

export const WORKFLOW_EXECUTION_STATUS = {
  TRIGGERED: 'workflow_execution_triggered',
  RUNNING: 'workflow_execution_running',
  COMPLETED: 'workflow_execution_completed',
  ERROR: 'workflow_execution_error',
};
