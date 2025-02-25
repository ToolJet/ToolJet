import { FEATURE_KEY } from '../constants';
import { FeatureConfig } from '@modules/app/types';
import { MODULES } from '@modules/app/constants/modules';

export interface Features {
  [FEATURE_KEY.LOGIN]: FeatureConfig;
  [FEATURE_KEY.SUPER_ADMIN_LOGIN]: FeatureConfig;
  [FEATURE_KEY.ORGANIZATION_LOGIN]: FeatureConfig;
  [FEATURE_KEY.ACTIVATE_ACCOUNT]: FeatureConfig;
  [FEATURE_KEY.AUTHORIZE]: FeatureConfig;
  [FEATURE_KEY.SWITCH_WORKSPACE]: FeatureConfig;
  [FEATURE_KEY.SETUP_ADMIN]: FeatureConfig;
  [FEATURE_KEY.SETUP_SUPER_ADMIN]: FeatureConfig;
  [FEATURE_KEY.SIGNUP]: FeatureConfig;
  [FEATURE_KEY.ACCEPT_INVITE]: FeatureConfig;
  [FEATURE_KEY.RESEND_INVITE]: FeatureConfig;
  [FEATURE_KEY.VERIFY_INVITE_TOKEN]: FeatureConfig;
  [FEATURE_KEY.VERIFY_ORGANIZATION_TOKEN]: FeatureConfig;
  [FEATURE_KEY.SETUP_ACCOUNT_FROM_TOKEN]: FeatureConfig;
  [FEATURE_KEY.REQUEST_TRIAL]: FeatureConfig;
  [FEATURE_KEY.ACTIVATE_TRIAL]: FeatureConfig;
  [FEATURE_KEY.GET_ONBOARDING_SESSION]: FeatureConfig;
  [FEATURE_KEY.GET_SIGNUP_ONBOARDING_SESSION]: FeatureConfig;
  [FEATURE_KEY.FINISH_ONBOARDING]: FeatureConfig;
  [FEATURE_KEY.TRIAL_DECLINED]: FeatureConfig;
  [FEATURE_KEY.FORGOT_PASSWORD]: FeatureConfig;
  [FEATURE_KEY.RESET_PASSWORD]: FeatureConfig;
  [FEATURE_KEY.GET_INVITEE_DETAILS]: FeatureConfig;
  [FEATURE_KEY.HEALTH_CHECK]: FeatureConfig;
  [FEATURE_KEY.ROOT_PAGE]: FeatureConfig;
  [FEATURE_KEY.OAUTH_COMMON_SIGN_IN]: FeatureConfig;
  [FEATURE_KEY.OAUTH_OPENID_CONFIGS]: FeatureConfig;
  [FEATURE_KEY.OAUTH_SAML_CONFIGS]: FeatureConfig;
  [FEATURE_KEY.OAUTH_SAML_RESPONSE]: FeatureConfig;
  [FEATURE_KEY.OAUTH_SIGN_IN]: FeatureConfig;
}

export interface FeaturesConfig {
  [MODULES.AUTH]: Features;
}
