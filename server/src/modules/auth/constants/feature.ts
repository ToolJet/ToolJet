import { FEATURE_KEY } from '.';
import { MODULES } from '@modules/app/constants/modules';
import { FeaturesConfig } from '../types';

export const FEATURES: FeaturesConfig = {
  // Auth Module
  [MODULES.AUTH]: {
    [FEATURE_KEY.LOGIN]: {
      isPublic: true,
      auditLogsKey: 'USER_LOGIN',
    },
    [FEATURE_KEY.SUPER_ADMIN_LOGIN]: {
      isPublic: true,
      auditLogsKey: 'USER_LOGIN',
    },
    [FEATURE_KEY.ORGANIZATION_LOGIN]: {
      isPublic: true,
      auditLogsKey: 'USER_LOGIN',
    },
    [FEATURE_KEY.ACTIVATE_ACCOUNT]: {
      isPublic: true,
    },
    [FEATURE_KEY.AUTHORIZE]: {
      isPublic: true,
    },
    [FEATURE_KEY.SWITCH_WORKSPACE]: {
      isPublic: true,
    },
    [FEATURE_KEY.SETUP_ADMIN]: {
      isPublic: true,
    },
    [FEATURE_KEY.SETUP_SUPER_ADMIN]: {
      isPublic: true,
    },
    [FEATURE_KEY.SIGNUP]: {
      isPublic: true,
      auditLogsKey: 'USER_SIGNUP',
    },
    [FEATURE_KEY.ACCEPT_INVITE]: {
      isPublic: true,
      auditLogsKey: 'USER_INVITE_REDEEM',
    },
    [FEATURE_KEY.RESEND_INVITE]: {
      isPublic: true,
    },
    [FEATURE_KEY.VERIFY_INVITE_TOKEN]: {
      isPublic: true,
    },
    [FEATURE_KEY.VERIFY_ORGANIZATION_TOKEN]: {
      isPublic: true,
    },
    [FEATURE_KEY.SETUP_ACCOUNT_FROM_TOKEN]: {
      auditLogsKey: 'USER_INVITE_REDEEM',
      isPublic: true,
    },
    [FEATURE_KEY.REQUEST_TRIAL]: {
      isPublic: true,
    },
    [FEATURE_KEY.ACTIVATE_TRIAL]: {
      isPublic: true,
    },
    [FEATURE_KEY.GET_ONBOARDING_SESSION]: {
      isPublic: true,
    },
    [FEATURE_KEY.GET_SIGNUP_ONBOARDING_SESSION]: {
      isPublic: true,
    },
    [FEATURE_KEY.FINISH_ONBOARDING]: {
      isPublic: true,
    },
    [FEATURE_KEY.TRIAL_DECLINED]: {
      isPublic: true,
    },
    [FEATURE_KEY.FORGOT_PASSWORD]: {
      isPublic: true,
    },
    [FEATURE_KEY.RESET_PASSWORD]: {
      isPublic: true,
    },
    [FEATURE_KEY.GET_INVITEE_DETAILS]: {
      auditLogsKey: 'USER_INVITE_REDEEM',
      isPublic: true,
    },
    [FEATURE_KEY.OAUTH_SIGN_IN]: {
      isPublic: true,
    },
    [FEATURE_KEY.OAUTH_OPENID_CONFIGS]: {
      isPublic: true,
    },
    [FEATURE_KEY.OAUTH_SAML_CONFIGS]: {
      isPublic: true,
    },
    [FEATURE_KEY.OAUTH_COMMON_SIGN_IN]: {
      isPublic: true,
    },
    [FEATURE_KEY.OAUTH_SAML_RESPONSE]: {
      isPublic: true,
    },
  },
};
