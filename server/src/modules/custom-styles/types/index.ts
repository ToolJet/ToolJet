import { MODULES } from '@modules/app/constants/modules';
import { FEATURE_KEY } from '../constants';
import { FeatureConfig } from '@modules/app/types';

interface Features {
  [FEATURE_KEY.GET_CUSTOM_STYLES]: FeatureConfig;
  [FEATURE_KEY.GET_CUSTOM_STYLES_FOR_APP]: FeatureConfig;
  [FEATURE_KEY.GET_CUSTOM_STYLES_FROM_APP]: FeatureConfig;
  [FEATURE_KEY.SAVE_CUSTOM_STYLES]: FeatureConfig;
}

export interface FeaturesConfig {
  [MODULES.CUSTOM_STYLES]: Features;
}
