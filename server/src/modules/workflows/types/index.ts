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
}

export interface FeaturesConfig {
  [MODULES.WORKFLOWS]: Features;
}
