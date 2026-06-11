import { FEATURE_KEY } from '../constants';
import { FeatureConfig } from '@modules/app/types';
import { MODULES } from '@modules/app/constants/modules';

interface Features {
  [FEATURE_KEY.ACTIVATE_ACCOUNT]: FeatureConfig;
  [FEATURE_KEY.SETUP_SUPER_ADMIN]: FeatureConfig;
  [FEATURE_KEY.SIGNUP]: FeatureConfig;
  [FEATURE_KEY.ACCEPT_INVITE]: FeatureConfig;
  [FEATURE_KEY.RESEND_INVITE]: FeatureConfig;
  [FEATURE_KEY.VERIFY_INVITE_TOKEN]: FeatureConfig;
  [FEATURE_KEY.VERIFY_ORGANIZATION_TOKEN]: FeatureConfig;
  [FEATURE_KEY.SETUP_ACCOUNT_FROM_TOKEN]: FeatureConfig;
  [FEATURE_KEY.CHECK_WORKSPACE_UNIQUENESS]: FeatureConfig;
  [FEATURE_KEY.REQUEST_TRIAL]: FeatureConfig;
  [FEATURE_KEY.ACTIVATE_TRIAL]: FeatureConfig;
  [FEATURE_KEY.GET_ONBOARDING_SESSION]: FeatureConfig;
  [FEATURE_KEY.GET_SIGNUP_ONBOARDING_SESSION]: FeatureConfig;
  [FEATURE_KEY.FINISH_ONBOARDING]: FeatureConfig;
  [FEATURE_KEY.TRIAL_DECLINED]: FeatureConfig;
  [FEATURE_KEY.GET_INVITEE_DETAILS]: FeatureConfig;
}

export interface FeaturesConfig {
  [MODULES.ONBOARDING]: Features;
}

export interface UserOnboardingDetails {
  companyName?: string;
  buildPurpose?: string;
}
