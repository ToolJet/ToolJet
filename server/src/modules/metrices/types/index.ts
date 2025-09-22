import { FEATURE_KEY } from '../constants';
import { FeatureConfig } from '@modules/app/types';
import { MODULES } from '@modules/app/constants/modules';

interface Features {
  [FEATURE_KEY.GET]: FeatureConfig;
}

export interface FeaturesConfig {
  [MODULES.METRICS]: Features;
}
