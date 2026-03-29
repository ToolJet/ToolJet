import { FEATURE_KEY } from '../constants';
import { FeatureConfig } from '@modules/app/types';
import { MODULES } from '@modules/app/constants/modules';

interface Features {
  [FEATURE_KEY.LIST_BRANCHES]: FeatureConfig;
  [FEATURE_KEY.CREATE_BRANCH]: FeatureConfig;
  [FEATURE_KEY.SWITCH_BRANCH]: FeatureConfig;
  [FEATURE_KEY.DELETE_BRANCH]: FeatureConfig;
  [FEATURE_KEY.PUSH_WORKSPACE]: FeatureConfig;
  [FEATURE_KEY.PULL_WORKSPACE]: FeatureConfig;
  [FEATURE_KEY.CHECK_UPDATES]: FeatureConfig;
  [FEATURE_KEY.LIST_REMOTE_BRANCHES]: FeatureConfig;
  [FEATURE_KEY.FETCH_PULL_REQUESTS]: FeatureConfig;
  [FEATURE_KEY.ENSURE_DRAFT]: FeatureConfig;
}

export interface FeaturesConfig {
  [MODULES.WORKSPACE_BRANCHES]: Features;
}
