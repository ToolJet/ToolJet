import { FeatureConfig } from '@modules/app/types';
import { MODULES } from '@modules/app/constants/modules';
import { FEATURE_KEY } from './constants';

interface Features {
  [FEATURE_KEY.GET]: FeatureConfig;
  [FEATURE_KEY.UPDATE]: FeatureConfig;
}

export interface FeaturesConfig {
  [MODULES.SSRF]: Features;
}
