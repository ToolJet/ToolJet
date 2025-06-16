import { FEATURE_KEY } from '../constants';
import { MODULES } from '@modules/app/constants/modules';
import { FeatureConfig } from '@modules/app/types';
interface Features {
  [FEATURE_KEY.CREATE_MODULE]: FeatureConfig;
  [FEATURE_KEY.DELETE_MODULE]: FeatureConfig;
  [FEATURE_KEY.UPDATE_MODULE]: FeatureConfig;
  [FEATURE_KEY.IMPORT_MODULE]: FeatureConfig;
  [FEATURE_KEY.EXORT_MODULE]: FeatureConfig;
  [FEATURE_KEY.CLONE_MODULE]: FeatureConfig;
}

export interface FeaturesConfig {
  [MODULES.MODULES]: Features;
}
