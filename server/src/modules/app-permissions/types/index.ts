import { FEATURE_KEY } from '../constants';
import { FeatureConfig } from '@modules/app/types';
import { MODULES } from '@modules/app/constants/modules';

interface Features {
  [FEATURE_KEY.FETCH_USERS]: FeatureConfig;
  [FEATURE_KEY.FETCH_USER_GROUPS]: FeatureConfig;
  [FEATURE_KEY.FETCH_PAGE_PERMISSIONS]: FeatureConfig;
  [FEATURE_KEY.CREATE_PAGE_PERMISSIONS]: FeatureConfig;
  [FEATURE_KEY.UPDATE_PAGE_PERMISSIONS]: FeatureConfig;
  [FEATURE_KEY.DELETE_PAGE_PERMISSIONS]: FeatureConfig;
  [FEATURE_KEY.FETCH_QUERY_PERMISSIONS]: FeatureConfig;
  [FEATURE_KEY.CREATE_QUERY_PERMISSIONS]: FeatureConfig;
  [FEATURE_KEY.UPDATE_QUERY_PERMISSIONS]: FeatureConfig;
  [FEATURE_KEY.DELETE_QUERY_PERMISSIONS]: FeatureConfig;
}

export interface FeaturesConfig {
  [MODULES.APP_PERMISSIONS]: Features;
}
