import { FEATURE_KEY } from '../constants';
import { FeatureConfig } from '@modules/app/types';
import { MODULES } from '@modules/app/constants/modules';

export interface Features {
  [FEATURE_KEY.LOGIN]: FeatureConfig;
  [FEATURE_KEY.SUPER_ADMIN_LOGIN]: FeatureConfig;
  [FEATURE_KEY.ORGANIZATION_LOGIN]: FeatureConfig;
  [FEATURE_KEY.AUTHORIZE]: FeatureConfig;
  [FEATURE_KEY.SWITCH_WORKSPACE]: FeatureConfig;
  [FEATURE_KEY.SETUP_ADMIN]: FeatureConfig;
  [FEATURE_KEY.FORGOT_PASSWORD]: FeatureConfig;
  [FEATURE_KEY.RESET_PASSWORD]: FeatureConfig;
  [FEATURE_KEY.OAUTH_COMMON_SIGN_IN]: FeatureConfig;
  [FEATURE_KEY.OAUTH_OPENID_CONFIGS]: FeatureConfig;
  [FEATURE_KEY.OAUTH_SAML_CONFIGS]: FeatureConfig;
  [FEATURE_KEY.OAUTH_SAML_RESPONSE]: FeatureConfig;
  [FEATURE_KEY.OAUTH_SIGN_IN]: FeatureConfig;
}

export interface FeaturesConfig {
  [MODULES.AUTH]: Features;
}
