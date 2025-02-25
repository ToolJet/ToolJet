import { FEATURE_KEY } from '../constants';
import { FeatureConfig } from '@modules/app/types';
import { MODULES } from '@modules/app/constants/modules';

interface Features {
  [FEATURE_KEY.GIT_CREATE_APP]: FeatureConfig;
  [FEATURE_KEY.GIT_GET_APP]: FeatureConfig;
  [FEATURE_KEY.GIT_GET_APPS]: FeatureConfig;
  [FEATURE_KEY.GIT_GET_APP_CONFIG]: FeatureConfig;
  [FEATURE_KEY.GIT_SYNC_APP]: FeatureConfig;
  [FEATURE_KEY.GIT_UPDATE_APP]: FeatureConfig;
}

export interface FeaturesConfig {
  [MODULES.APP_GIT]: Features;
}
