import { FEATURE_KEY } from './index';
import { MODULES } from '@modules/app/constants/modules';
import { FeaturesConfig } from '../types';

export const FEATURES: FeaturesConfig = {
  [MODULES.USER]: {
    [FEATURE_KEY.GET_ALL_USERS]: {},
    [FEATURE_KEY.UPDATE_USER_TYPE]: {
      isPublic: true,
      auditLogsKey: 'USER_DETAILS_UPDATE',
    },
    [FEATURE_KEY.UPDATE_USER_TYPE_INSTANCE]: {
      isPublic: true,
      auditLogsKey: 'SET_AS_SUPERADMIN',
    },
    [FEATURE_KEY.AUTO_UPDATE_USER_PASSWORD]: {},
    [FEATURE_KEY.CHANGE_USER_PASSWORD]: {},
  },
};
