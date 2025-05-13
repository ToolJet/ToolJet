import { FEATURE_KEY } from '.';
import { MODULES } from '@modules/app/constants/modules';
import { FeaturesConfig } from '../types';

export const FEATURES: FeaturesConfig = {
  [MODULES.SESSION]: {
    [FEATURE_KEY.LOG_OUT]: {
      isPublic: true,
      auditLogsKey: 'USER_LOGOUT',
    },
    [FEATURE_KEY.GET_INVITED_USER_SESSION]: {
      isPublic: true,
    },
    [FEATURE_KEY.GET_USER_SESSION]: {},
  },
};
