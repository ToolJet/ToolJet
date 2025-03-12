import { FEATURE_KEY } from './constants';
import { MODULES } from '@modules/app/constants/modules';
import { FeatureConfig } from '@modules/app/types';

interface Features {
  [FEATURE_KEY.GET_ALL_USERS]: FeatureConfig;
  [FEATURE_KEY.UPDATE_USER_TYPE]: FeatureConfig;
  [FEATURE_KEY.AUTO_UPDATE_USER_PASSWORD]: FeatureConfig;
  [FEATURE_KEY.CHANGE_USER_PASSWORD]: FeatureConfig;
}

export interface FeaturesConfig {
  [MODULES.USER]: Features;
}
