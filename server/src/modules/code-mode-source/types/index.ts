import { MODULES } from '@modules/app/constants/modules';
import { FEATURE_KEY } from '../constants';
import { FeatureConfig } from '@modules/app/types';

interface Features {
  [FEATURE_KEY.GET_SOURCE]: FeatureConfig;
  [FEATURE_KEY.WRITE_SOURCE]: FeatureConfig;
  [FEATURE_KEY.IMPORT_SOURCE]: FeatureConfig;
  [FEATURE_KEY.UPLOAD_DEV_BUNDLE]: FeatureConfig;
  [FEATURE_KEY.LIST_REVISIONS]: FeatureConfig;
  [FEATURE_KEY.PUBLISH_CODE]: FeatureConfig;
  [FEATURE_KEY.DOWNLOAD_CLI]: FeatureConfig;
}

export interface FeaturesConfig {
  [MODULES.CODE_MODE_SOURCE]: Features;
}
