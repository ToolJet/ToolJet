import { MODULES } from '@modules/app/constants/modules';
import { FEATURE_KEY } from '../constants';
import { FeatureConfig } from '@modules/app/types';

interface Features {
  [FEATURE_KEY.GET]: FeatureConfig;
}

export interface FeaturesConfig {
  [MODULES.FILE]: Features;
}
