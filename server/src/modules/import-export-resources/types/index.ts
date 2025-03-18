import { MODULES } from '@modules/app/constants/modules';
import { FEATURE_KEY } from '../constants';
import { FeatureConfig } from '@modules/app/types';

interface Features {
  [FEATURE_KEY.APP_RESOURCE_EXPORT]: FeatureConfig;
  [FEATURE_KEY.APP_RESOURCE_IMPORT]: FeatureConfig;
  [FEATURE_KEY.APP_RESOURCE_CLONE]: FeatureConfig;
}

export interface FeaturesConfig {
  [MODULES.IMPORT_EXPORT_RESOURCES]: Features;
}
