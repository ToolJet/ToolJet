import { MODULES } from '@modules/app/constants/modules';
import { FEATURE_KEY } from '../constants';
import { FeatureConfig } from '@modules/app/types';

interface Features {
  [FEATURE_KEY.GET_ALL_USERS]: FeatureConfig;
  [FEATURE_KEY.GET_USER]: FeatureConfig;
  [FEATURE_KEY.CREATE_USER]: FeatureConfig;
  [FEATURE_KEY.UPDATE_USER]: FeatureConfig;
  [FEATURE_KEY.REPLACE_USER_WORKSPACES]: FeatureConfig;
  [FEATURE_KEY.UPDATE_USER_WORKSPACE]: FeatureConfig;
  [FEATURE_KEY.GET_ALL_WORKSPACES]: FeatureConfig;
  [FEATURE_KEY.UPDATE_USER_ROLE]: FeatureConfig;
}

export interface FeaturesConfig {
  [MODULES.EXTERNAL_APIS]: Features;
}
