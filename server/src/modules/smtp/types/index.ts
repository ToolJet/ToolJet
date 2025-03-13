import { FeatureConfig } from '@modules/app/types';
import { FEATURE_KEY } from '../constants';
import { MODULES } from '@modules/app/constants/modules';

interface Features {
  [FEATURE_KEY.GET]: FeatureConfig;
  [FEATURE_KEY.UPDATE]: FeatureConfig;
  [FEATURE_KEY.UPDATE_ENV]: FeatureConfig;
  [FEATURE_KEY.UPDATE_STATUS]: FeatureConfig;
}

export interface FeaturesConfig {
  [MODULES.SMTP]: Features;
}
