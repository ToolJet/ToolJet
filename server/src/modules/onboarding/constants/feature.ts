import { FEATURE_KEY } from '.';
import { MODULES } from '@modules/app/constants/modules';
import { FeaturesConfig } from '../types';

export const FEATURES: FeaturesConfig = {
  [MODULES.ONBOARDING]: {
    [FEATURE_KEY.ACTIVATE_ACCOUNT]: {
      isPublic: true,
      auditLogsKey: 'USER_SIGNUP',
    }, // Account Activation
    [FEATURE_KEY.SETUP_SUPER_ADMIN]: {
      isPublic: true,
    }, // Super Admin Setup
    [FEATURE_KEY.SIGNUP]: {
      isPublic: true,
    }, // Signup
    [FEATURE_KEY.ACCEPT_INVITE]: {
      isPublic: true,
      auditLogsKey: 'USER_INVITE_REDEEM',
    }, // Accept Invitation
    [FEATURE_KEY.RESEND_INVITE]: {
      isPublic: true,
    }, // Resend Invitation
    [FEATURE_KEY.VERIFY_INVITE_TOKEN]: {
      isPublic: true,
    }, // Verify Invitation Token
    [FEATURE_KEY.VERIFY_ORGANIZATION_TOKEN]: {
      isPublic: true,
    }, // Verify Organization Token
    [FEATURE_KEY.SETUP_ACCOUNT_FROM_TOKEN]: {
      isPublic: true,
      auditLogsKey: 'USER_SIGNUP',
    }, // Setup Account From Token
    [FEATURE_KEY.CHECK_WORKSPACE_UNIQUENESS]: {
      isPublic: true,
    }, // Check Workspace Uniqueness
    [FEATURE_KEY.REQUEST_TRIAL]: {}, // Trial Request
    [FEATURE_KEY.ACTIVATE_TRIAL]: {}, // Trial Activation
    [FEATURE_KEY.GET_ONBOARDING_SESSION]: {}, // Onboarding Session
    [FEATURE_KEY.GET_SIGNUP_ONBOARDING_SESSION]: {}, // Signup Onboarding Session
    [FEATURE_KEY.FINISH_ONBOARDING]: {}, // Finish Onboarding
    [FEATURE_KEY.TRIAL_DECLINED]: {}, // Trial Declined
    [FEATURE_KEY.GET_INVITEE_DETAILS]: {
      isPublic: true,
    }, // Get Invitee Details
  },
};
