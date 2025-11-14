import { MODULES } from '@modules/app/constants/modules';
import { FEATURE_KEY } from '../constants';
import { FeatureConfig } from '@modules/app/types';

interface Features {
  [FEATURE_KEY.GET_ALL_USERS]: FeatureConfig;
  [FEATURE_KEY.GET_USER]: FeatureConfig;
  [FEATURE_KEY.CREATE_USER]: FeatureConfig;
  [FEATURE_KEY.UPDATE_USER]: FeatureConfig;
  [FEATURE_KEY.PATCH_USER]: FeatureConfig;
  [FEATURE_KEY.GET_ALL_GROUPS]: FeatureConfig;
  [FEATURE_KEY.GET_GROUP]: FeatureConfig;
  [FEATURE_KEY.CREATE_GROUP]: FeatureConfig;
  [FEATURE_KEY.UPDATE_GROUP]: FeatureConfig;
  [FEATURE_KEY.PATCH_GROUP]: FeatureConfig;
  [FEATURE_KEY.GET_SP_CONFIG]: FeatureConfig;
  [FEATURE_KEY.GET_RESOURCE_TYPES]: FeatureConfig;
  [FEATURE_KEY.GET_SCHEMAS]: FeatureConfig;
  [FEATURE_KEY.GET_SCHEMA]: FeatureConfig;
  [FEATURE_KEY.DELETE_USER]: FeatureConfig;
  [FEATURE_KEY.DELETE_GROUP]: FeatureConfig;
}

export interface FeaturesConfig {
  [MODULES.SCIM]: Features;
}
