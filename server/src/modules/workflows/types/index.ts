import { FEATURE_KEY } from '../constants';
import { FeatureConfig } from '@modules/app/types';
import { MODULES } from '@modules/app/constants/modules';

// Workflow trigger types
export const WORKFLOW_TRIGGER_TYPE = {
  MANUAL: 'manual',
  SCHEDULE: 'schedule',
  WEBHOOK: 'webhook',
} as const;

export type WorkflowTriggerType = typeof WORKFLOW_TRIGGER_TYPE[keyof typeof WORKFLOW_TRIGGER_TYPE];

// Execution metadata interface for job data
export interface ExecutionMetadata {
  timeout: number;
  triggeredBy: WorkflowTriggerType;
  triggeredAt: Date;
  scheduleId?: string; // Optional, only present for scheduled workflows
}

export interface ExecuteWorkflowOptions {
  params?: Record<string, any>;
  environmentId?: string;
  response?: any; // Response object from Express
  throwOnError?: boolean;
  executeUsing?: string;
  executionStartTime?: Date;
  startNodeId?: string; // Start execution from a specific node (for preview)
  injectedState?: object; // Inject state when starting from a specific node (for preview)
}

// Feature configuration interfaces
interface Features {
  [FEATURE_KEY.EXECUTE_WORKFLOW]: FeatureConfig;
  [FEATURE_KEY.EXECUTE_WORKFLOW_FROM_APP]: FeatureConfig;
  [FEATURE_KEY.WORKFLOW_EXECUTION_STATUS]: FeatureConfig;
  [FEATURE_KEY.WORKFLOW_EXECUTION_DETAILS]: FeatureConfig;
  [FEATURE_KEY.LIST_WORKFLOW_EXECUTIONS]: FeatureConfig;
  [FEATURE_KEY.FETCH_EXECUTION_LOGS]: FeatureConfig;
  [FEATURE_KEY.FETCH_EXECUTION_NODES]: FeatureConfig;
  [FEATURE_KEY.PREVIEW_QUERY_NODE]: FeatureConfig;
  [FEATURE_KEY.CREATE_WORKFLOW_SCHEDULE]: FeatureConfig;
  [FEATURE_KEY.LIST_WORKFLOW_SCHEDULES]: FeatureConfig;
  [FEATURE_KEY.FIND_WORKFLOW_SCHEDULE]: FeatureConfig;
  [FEATURE_KEY.UPDATE_SCHEDULED_WORKFLOW]: FeatureConfig;
  [FEATURE_KEY.ACTIVATE_SCHEDULED_WORKFLOW]: FeatureConfig;
  [FEATURE_KEY.REMOVE_SCHEDULED_WORKFLOW]: FeatureConfig;
  [FEATURE_KEY.WEBHOOK_TRIGGER_WORKFLOW]: FeatureConfig;
  [FEATURE_KEY.UPDATE_WORKFLOW_WEBHOOK_DETAILS]: FeatureConfig;
  [FEATURE_KEY.CREATE_WORKFLOW]: FeatureConfig;
  [FEATURE_KEY.NPM_PACKAGES]: FeatureConfig;
  [FEATURE_KEY.TERMINATE_WORKFLOW_EXECUTION]: FeatureConfig;
  [FEATURE_KEY.WORKFLOW_EXECUTION_STATE]: FeatureConfig;
}

export interface FeaturesConfig {
  [MODULES.WORKFLOWS]: Features;
}

/**
 * Custom error thrown when a workflow execution is terminated by user request.
 * This error is handled specially by the processor to ensure:
 * 1. Job is not moved to "completed" state (it's already in "failed" state)
 * 2. Resources are cleaned up properly (isolate disposal, logs saved)
 * 3. No "Missing lock" error occurs
 *
 * This error distinguishes user-initiated termination from execution failures,
 * allowing different handling logic in the processor.
 */
export class WorkflowTerminationError extends Error {
  public readonly executionId: string;
  public readonly terminatedAt: Date;

  constructor(executionId: string, message?: string) {
    super(message || 'Workflow execution terminated');
    this.name = 'WorkflowTerminationError';
    this.executionId = executionId;
    this.terminatedAt = new Date();

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, WorkflowTerminationError);
    }
  }
}
