import { FEATURE_KEY } from '../constants';
import { FeatureConfig } from '@modules/app/types';
import { MODULES } from '@modules/app/constants/modules';

interface Features {
  [FEATURE_KEY.GET_ORGANIZATION_GIT]: FeatureConfig;
  [FEATURE_KEY.GET_ORGANIZATION_GIT_STATUS]: FeatureConfig;
  [FEATURE_KEY.CREATE_ORGANIZATION_GIT]: FeatureConfig;
  [FEATURE_KEY.SAVE_PROVIDER_CONFIGS]: FeatureConfig;
  [FEATURE_KEY.FINALIZE_CONFIGS]: FeatureConfig;
  [FEATURE_KEY.UPDATE_PROVIDER_CONFIGS]: FeatureConfig;
  [FEATURE_KEY.UPDATE_ORGANIZATION_GIT_STATUS]: FeatureConfig;
  [FEATURE_KEY.DELETE_ORGANIZATION_GIT_CONFIGS]: FeatureConfig;
  [FEATURE_KEY.SAVE_ENV_PROVIDER_CONFIGS]: FeatureConfig;
  [FEATURE_KEY.ENABLE_AUTO_SYNC]: FeatureConfig;
  [FEATURE_KEY.DISABLE_AUTO_SYNC]: FeatureConfig;
  [FEATURE_KEY.ROTATE_AUTO_SYNC_SECRET]: FeatureConfig;
  [FEATURE_KEY.GET_AUTO_SYNC_STATUS]: FeatureConfig;
  [FEATURE_KEY.GET_AUTO_SYNC_EVENTS]: FeatureConfig;
}

export interface FeaturesConfig {
  [MODULES.GIT_SYNC]: Features;
}
