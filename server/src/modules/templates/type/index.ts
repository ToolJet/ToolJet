import { FEATURE_KEY } from '../constants';
import { MODULES } from '@modules/app/constants/modules';
import { FeatureConfig } from '@modules/app/types';

interface Features {
  [FEATURE_KEY.CREATE_LIBRARY_APP]: FeatureConfig;
  [FEATURE_KEY.CREATE_SAMPLE_APP]: FeatureConfig;
  [FEATURE_KEY.CREATE_SAMPLE_ONBOARD_APP]: FeatureConfig;
  [FEATURE_KEY.FETCH_TEMPLATES_LIST]: FeatureConfig;
}

export interface FeaturesConfig {
  [MODULES.TEMPLATES]: Features;
}
