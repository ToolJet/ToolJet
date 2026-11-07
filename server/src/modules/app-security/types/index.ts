import { MODULES } from '@modules/app/constants/modules';
import { FEATURE_KEY, POLICY_FEATURE_KEY } from '../constants';
import { FeatureConfig } from '@modules/app/types';

interface AppFeatures {
  [FEATURE_KEY.GET_SCANS]: FeatureConfig;
  [FEATURE_KEY.RUN_SCAN]: FeatureConfig;
  [FEATURE_KEY.PUBLISH_SCAN]: FeatureConfig;
  [FEATURE_KEY.UPLOAD_SCAN_RESULTS]: FeatureConfig;
  [FEATURE_KEY.OVERRIDE_GATE]: FeatureConfig;
}

interface PolicyFeatures {
  [POLICY_FEATURE_KEY.GET_POLICY]: FeatureConfig;
  [POLICY_FEATURE_KEY.UPDATE_POLICY]: FeatureConfig;
  [POLICY_FEATURE_KEY.LIST_EXCEPTIONS]: FeatureConfig;
  [POLICY_FEATURE_KEY.CREATE_EXCEPTION]: FeatureConfig;
  [POLICY_FEATURE_KEY.REVOKE_EXCEPTION]: FeatureConfig;
  [POLICY_FEATURE_KEY.SECURITY_CENTER]: FeatureConfig;
  [POLICY_FEATURE_KEY.RECHECK]: FeatureConfig;
}

export interface FeaturesConfig {
  [MODULES.APP_SECURITY]: AppFeatures;
  [MODULES.APP_SECURITY_POLICY]: PolicyFeatures;
}
