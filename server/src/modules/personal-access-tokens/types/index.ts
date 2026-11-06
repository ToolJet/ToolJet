import { MODULES } from '@modules/app/constants/modules';
import { FEATURE_KEY } from '../constants';
import { FeatureConfig } from '@modules/app/types';

interface Features {
  [FEATURE_KEY.CREATE_PAT]: FeatureConfig;
  [FEATURE_KEY.LIST_PATS]: FeatureConfig;
  [FEATURE_KEY.DELETE_PAT]: FeatureConfig;
  [FEATURE_KEY.VALIDATE_PAT]: FeatureConfig;
  [FEATURE_KEY.CREATE_PAT_SESSION]: FeatureConfig;
  [FEATURE_KEY.CREATE_AI_RENDER_SESSION]: FeatureConfig;
  [FEATURE_KEY.START_DEVICE_LOGIN]: FeatureConfig;
  [FEATURE_KEY.POLL_DEVICE_LOGIN]: FeatureConfig;
  [FEATURE_KEY.LOOKUP_DEVICE_LOGIN]: FeatureConfig;
  [FEATURE_KEY.APPROVE_DEVICE_LOGIN]: FeatureConfig;
}

export interface FeaturesConfig {
  [MODULES.PERSONAL_ACCESS_TOKENS]: Features;
}
