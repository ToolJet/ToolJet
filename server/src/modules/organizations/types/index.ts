import { FEATURE_KEY } from '../constants';
import { FeatureConfig } from '@modules/app/types';
import { MODULES } from '@modules/app/constants/modules';

interface Features {
  [FEATURE_KEY.CHECK_UNIQUE]: FeatureConfig;
  [FEATURE_KEY.GET]: FeatureConfig;
  [FEATURE_KEY.UPDATE]: FeatureConfig;
  [FEATURE_KEY.CREATE]: FeatureConfig;
  [FEATURE_KEY.CHECK_UNIQUE_ONBOARDING]: FeatureConfig;
  [FEATURE_KEY.WORKSPACE_ARCHIVE]: FeatureConfig;
  [FEATURE_KEY.WORKSPACE_UNARCHIVE]: FeatureConfig;
  [FEATURE_KEY.SET_DEFAULT]: FeatureConfig;
  [FEATURE_KEY.CREATE_WORKSPACE_V2]: FeatureConfig;
  [FEATURE_KEY.LIST_WORKSPACES_V2]: FeatureConfig;
  [FEATURE_KEY.GET_WORKSPACE_V2]: FeatureConfig;
  [FEATURE_KEY.UPDATE_WORKSPACE_V2]: FeatureConfig;
  [FEATURE_KEY.ARCHIVE_WORKSPACE_V2]: FeatureConfig;
  [FEATURE_KEY.UNARCHIVE_WORKSPACE_V2]: FeatureConfig;
  [FEATURE_KEY.SET_DEFAULT_WORKSPACE_V2]: FeatureConfig;
}

export interface FeaturesConfig {
  [MODULES.ORGANIZATIONS]: Features;
}
export { FEATURE_KEY };
