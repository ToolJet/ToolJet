import { FEATURE_KEY } from '../constants';
import { FeatureConfig } from '@modules/app/types';
import { MODULES } from '@modules/app/constants/modules';

interface Features {
  [FEATURE_KEY.EXECUTE_WORKFLOW]: FeatureConfig;
  [FEATURE_KEY.WORKFLOW_EXECUTION_STATUS]: FeatureConfig;
  [FEATURE_KEY.WORKFLOW_EXECUTION_DETAILS]: FeatureConfig;
  [FEATURE_KEY.LIST_WORKFLOW_EXECUTIONS]: FeatureConfig;
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
}

export interface FeaturesConfig {
  [MODULES.WORKFLOWS]: Features;
}
