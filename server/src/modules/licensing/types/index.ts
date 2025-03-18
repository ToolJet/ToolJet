import { FeatureConfig } from '@modules/app/types';
import { FEATURE_KEY } from '../constants';
import { MODULES } from '@modules/app/constants/modules';

interface Features {
  [FEATURE_KEY.GET_ACCESS]: FeatureConfig;
  [FEATURE_KEY.GET_DOMAINS]: FeatureConfig;
  [FEATURE_KEY.GET_LICENSE]: FeatureConfig;
  [FEATURE_KEY.GET_PLANS]: FeatureConfig;
  [FEATURE_KEY.GET_TERMS]: FeatureConfig;
  [FEATURE_KEY.GET_ORGANIZATION_LIMITS]: FeatureConfig;
  [FEATURE_KEY.GET_APP_LIMITS]: FeatureConfig;
  [FEATURE_KEY.CHECK_AUDIT_LOGS_LICENSE]: FeatureConfig;
  [FEATURE_KEY.GET_AUDIT_LOGS_MAX_DURATION]: FeatureConfig;
  [FEATURE_KEY.GET_WORKFLOW_LIMITS]: FeatureConfig;
  [FEATURE_KEY.GET_USER_LIMITS]: FeatureConfig;
  [FEATURE_KEY.UPDATE_LICENSE]: FeatureConfig;
  [FEATURE_KEY.GET_ORGANIZATION_LIMITS]: FeatureConfig;
  [FEATURE_KEY.GET_APP_LIMITS]: FeatureConfig;
}

export interface FeaturesConfig {
  [MODULES.LICENSING]: Features;
}
