import { FEATURE_KEY } from '../constants';
import { FeatureConfig } from '@modules/app/types';
import { MODULES } from '@modules/app/constants/modules';

interface Features {
  [FEATURE_KEY.GIT_SYNC_GET_ORG_GIT]: FeatureConfig;
  [FEATURE_KEY.GIT_SYNC_GET_ORG_GIT_STATUS]: FeatureConfig;
  [FEATURE_KEY.GIT_SYNC_CREATE_ORG_GIT]: FeatureConfig;
  [FEATURE_KEY.GIT_SYNC_UPDATE_ORG_GIT]: FeatureConfig;
  [FEATURE_KEY.GIT_SYNC_FINALIZE_ORG_GIT]: FeatureConfig;
  [FEATURE_KEY.GIT_SYNC_CHANGE_STATUS]: FeatureConfig;
  [FEATURE_KEY.GIT_SYNC_DELETE_ORG_GIT]: FeatureConfig;
}

export interface FeaturesConfig {
  [MODULES.GIT_SYNC]: Features;
}
