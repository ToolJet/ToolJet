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
}

export interface FeaturesConfig {
  [MODULES.ORGANIZATIONS]: Features;
}
export { FEATURE_KEY };
