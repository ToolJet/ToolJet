import { FEATURE_KEY } from '../constants';
import { FeatureConfig } from '@modules/app/types';
import { MODULES } from '@modules/app/constants/modules';

interface Features {
  [FEATURE_KEY.INIT]: FeatureConfig;
  [FEATURE_KEY.POST_ACTION]: FeatureConfig;
  [FEATURE_KEY.GET_ALL]: FeatureConfig;
  [FEATURE_KEY.GET_DEFAULT]: FeatureConfig;
  [FEATURE_KEY.GET_VERSIONS_BY_ENVIRONMENT]: FeatureConfig;
  [FEATURE_KEY.CREATE]: FeatureConfig;
  [FEATURE_KEY.UPDATE]: FeatureConfig;
  [FEATURE_KEY.DELETE]: FeatureConfig;
  [FEATURE_KEY.GET_BY_ID]: FeatureConfig;
}

export interface FeaturesConfig {
  [MODULES.APP_ENVIRONMENTS]: Features;
}
