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
    [FEATURE_KEY.AUTHORIZE]: {
      isPublic: true,
    },
    [FEATURE_KEY.SWITCH_WORKSPACE]: {
      isPublic: true,
    },
    [FEATURE_KEY.SETUP_ADMIN]: {
      isPublic: true,
    },
    [FEATURE_KEY.FORGOT_PASSWORD]: {
      isPublic: true,
      auditLogsKey: 'USER_PASSWORD_FORGOT',
    },
    [FEATURE_KEY.RESET_PASSWORD]: {
      isPublic: true,
      auditLogsKey: 'USER_PASSWORD_RESET',
    },
    [FEATURE_KEY.OAUTH_SIGN_IN]: {
      isPublic: true,
      auditLogsKey: 'USER_LOGIN',
    },
    [FEATURE_KEY.OAUTH_OPENID_CONFIGS]: {
      isPublic: true,
    },
    [FEATURE_KEY.OAUTH_SAML_CONFIGS]: {
      isPublic: true,
    },
    [FEATURE_KEY.OAUTH_COMMON_SIGN_IN]: {
      isPublic: true,
      auditLogsKey: 'USER_LOGIN',
    },
    [FEATURE_KEY.OAUTH_SAML_RESPONSE]: {
      isPublic: true,
    },
    [FEATURE_KEY.AI_ONBOARDING]: {
      isPublic: true,
    },
    [FEATURE_KEY.AI_ONBOARDING_SSO]: {
      isPublic: true,
    },
    [FEATURE_KEY.AI_COOKIE_SET]: {
      isPublic: true,
    },
    [FEATURE_KEY.AI_COOKIE_DELETE]: {
      isPublic: true,
    },
  },
};
