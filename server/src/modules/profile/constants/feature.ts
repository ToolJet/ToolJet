import { FEATURE_KEY } from '.';
import { MODULES } from '@modules/app/constants/modules';
import { FeaturesConfig } from '../types';

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
  },
};
