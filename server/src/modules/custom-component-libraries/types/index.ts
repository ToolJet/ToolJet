import { MODULES } from '@modules/app/constants/modules';
import { FEATURE_KEY } from '../constants';
import { FeatureConfig } from '@modules/app/types';

interface Features {
  [FEATURE_KEY.CREATE_LIBRARY]: FeatureConfig;
  [FEATURE_KEY.GET_LIBRARY]: FeatureConfig;
  [FEATURE_KEY.DELETE_LIBRARY]: FeatureConfig;
  [FEATURE_KEY.LIST_LIBRARIES]: FeatureConfig;
  [FEATURE_KEY.UPLOAD_DEV_BUNDLE]: FeatureConfig;
  [FEATURE_KEY.STREAM_DEV_BUNDLE]: FeatureConfig;
  [FEATURE_KEY.PUBLISH_REVISION]: FeatureConfig;
  [FEATURE_KEY.SERVE_BUNDLE]: FeatureConfig;
}

export interface FeaturesConfig {
  [MODULES.CUSTOM_COMPONENT_LIBRARIES]: Features;
}
