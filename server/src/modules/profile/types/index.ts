import { FEATURE_KEY } from '../constants';
import { FeatureConfig } from '@modules/app/types';
import { MODULES } from '@modules/app/constants/modules';

interface Features {
  [FEATURE_KEY.UPDATE_AVATAR]: FeatureConfig;
  [FEATURE_KEY.GET]: FeatureConfig;
  [FEATURE_KEY.UPDATE]: FeatureConfig;
  [FEATURE_KEY.UPDATE_PASSWORD]: FeatureConfig;
}

export interface FeaturesConfig {
  [MODULES.PROFILE]: Features;
}
export { FEATURE_KEY };
