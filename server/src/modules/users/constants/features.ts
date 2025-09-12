import { FEATURE_KEY } from './index';
import { MODULES } from '@modules/app/constants/modules';
import { FeaturesConfig } from '../types';

export const FEATURES: FeaturesConfig = {
  [MODULES.USER]: {
    [FEATURE_KEY.GET_ALL_USERS]: {
      isSuperAdminFeature: true,
    },
    [FEATURE_KEY.UPDATE_USER_TYPE]: {
      isSuperAdminFeature: true,
      auditLogsKey: 'USER_DETAILS_UPDATE',
    },
    [FEATURE_KEY.UPDATE_USER_TYPE_INSTANCE]: {
      isSuperAdminFeature: true,
      auditLogsKey: 'SET_AS_SUPERADMIN',
    },
    [FEATURE_KEY.AUTO_UPDATE_USER_PASSWORD]: {
      isSuperAdminFeature: true,
      auditLogsKey: 'USER_PASSWORD_RESET',
    },
    [FEATURE_KEY.CHANGE_USER_PASSWORD]: {
      isSuperAdminFeature: true,
      auditLogsKey: 'USER_PASSWORD_RESET',
    },
  },
};
