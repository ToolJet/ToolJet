import { FEATURE_KEY } from '.';
import { MODULES } from '@modules/app/constants/modules';
import { FeaturesConfig } from '../types';
import { LICENSE_FIELD } from '@modules/licensing/constants';

export const FEATURES: FeaturesConfig = {
  [MODULES.PROFILE]: {
    [FEATURE_KEY.UPDATE_AVATAR]: {
      isPublic: true,
      auditLogsKey: 'USER_PROFILE_UPDATE',
    },
    [FEATURE_KEY.GET]: {},
    [FEATURE_KEY.UPDATE]: {
      isPublic: true,
      auditLogsKey: 'USER_PROFILE_UPDATE',
    },
    [FEATURE_KEY.UPDATE_PASSWORD]: {
      isPublic: true,
      auditLogsKey: 'USER_PASSWORD_UPDATE',
    },
    [FEATURE_KEY.MFA_SETUP]: {
      license: LICENSE_FIELD.MFA,
    },
    [FEATURE_KEY.MFA_CONFIRM]: {
      license: LICENSE_FIELD.MFA,
      isPublic: true,
      auditLogsKey: 'USER_MFA_ENABLED',
    },
    // No license gate here on purpose: a user must always be able to turn off their own
    // 2FA (e.g. if the license lapses after they enrolled), same as MFA_VERIFY/toggling a
    // user off isn't license-gated either - only ever enabling MFA requires a valid license.
    [FEATURE_KEY.MFA_DISABLE]: {
      isPublic: true,
      auditLogsKey: 'USER_MFA_DISABLED',
    },
  },
};
