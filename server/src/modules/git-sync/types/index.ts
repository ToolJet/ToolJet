import { FEATURE_KEY } from '../constants';
import { FeatureConfig } from '@modules/app/types';
import { MODULES } from '@modules/app/constants/modules';

interface Features {
  [FEATURE_KEY.SAVE_PROVIDER_CONFIGS]: FeatureConfig;
  [FEATURE_KEY.FINALIZE_CONFIGS]: FeatureConfig;
  [FEATURE_KEY.SAVE_ENV_PROVIDER_CONFIGS]: FeatureConfig;
}

export interface FeaturesConfig {
  [MODULES.GIT_SYNC]: Features;
}
