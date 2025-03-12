import { FeatureConfig } from '@modules/app/types';
import { FEATURE_KEY } from '../constants';
import { MODULES } from '@modules/app/constants/modules';

export interface Features {
  [FEATURE_KEY.GET]: FeatureConfig;
  [FEATURE_KEY.CREATE]: FeatureConfig;
  [FEATURE_KEY.DELETE]: FeatureConfig;
  [FEATURE_KEY.UPDATE]: FeatureConfig;
  [FEATURE_KEY.UPDATE_DATA_SOURCE]: FeatureConfig;
  [FEATURE_KEY.UPDATE_ONE]: FeatureConfig;
  [FEATURE_KEY.RUN_EDITOR]: FeatureConfig;
  [FEATURE_KEY.RUN_VIEWER]: FeatureConfig;
  [FEATURE_KEY.PREVIEW]: FeatureConfig;
}

export interface FeaturesConfig {
  [MODULES.DATA_QUERY]: Features;
}
