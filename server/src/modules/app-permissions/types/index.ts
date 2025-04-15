import { FEATURE_KEY } from '../constants';
import { FeatureConfig } from '@modules/app/types';
import { MODULES } from '@modules/app/constants/modules';

interface Features {
  [FEATURE_KEY.FETCH_USERS]: FeatureConfig;
}

export interface FeaturesConfig {
  [MODULES.APP_PERMISSIONS]: Features;
}
