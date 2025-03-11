import { FEATURE_KEY } from '../constants';
import { FeatureConfig } from '@modules/app/types';
import { MODULES } from '@modules/app/constants/modules';

interface Features {
  [FEATURE_KEY.GET_PUBLIC_CONFIGS]: FeatureConfig;
  [FEATURE_KEY.GET_WIDGETS]: FeatureConfig;
}

export interface FeaturesConfig {
  [MODULES.CONFIGS]: Features;
}
