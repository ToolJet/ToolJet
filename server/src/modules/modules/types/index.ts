import { FEATURE_KEY } from '../constants';
import { MODULES } from '@modules/app/constants/modules';
import { FeatureConfig } from '@modules/app/types';
interface Features {
  [FEATURE_KEY.CREATE_MODULE]: FeatureConfig;
}

export interface FeaturesConfig {
  [MODULES.MODULES]: Features;
}
