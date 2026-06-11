import { FEATURE_KEY } from '../constants';
import { FeatureConfig } from '@modules/app/types';
import { MODULES } from '@modules/app/constants/modules';

interface Features {
  [FEATURE_KEY.SOME_FEATURE]: FeatureConfig;
}

export interface FeaturesConfig {
  [MODULES.NEW_MODULE]: Features;
}
