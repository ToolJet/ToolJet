import { FEATURE_KEY } from '../constants';
import { FeatureConfig } from '@modules/app/types';
import { MODULES } from '@modules/app/constants/modules';

interface Features {
  [FEATURE_KEY.INGEST]: FeatureConfig;
}

export interface FeaturesConfig {
  [MODULES.FRONTEND_METRICS]: Features;
}
