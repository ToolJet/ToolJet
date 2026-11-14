import { FEATURE_KEY } from './index';
import { MODULES } from '@modules/app/constants/modules';
import { FeaturesConfig } from '../types';

export const FEATURES: FeaturesConfig = {
  [MODULES.APP]: {
    // Public-app skip covers reads/run only; mutations keep the permission check.
    [FEATURE_KEY.CREATE]: { shouldNotSkipPublicApp: true },
    [FEATURE_KEY.UPDATE]: { shouldNotSkipPublicApp: true },
    [FEATURE_KEY.APP_PUBLIC_UPDATE]: {
      auditLogsKey: 'APP_PUBLIC_UPDATE',
      shouldNotSkipPublicApp: true,
    },
    [FEATURE_KEY.UPDATE_ICON]: {
      auditLogsKey: FEATURE_KEY.UPDATE,
      shouldNotSkipPublicApp: true,
    },
    [FEATURE_KEY.DELETE]: { shouldNotSkipPublicApp: true },
    [FEATURE_KEY.GET]: {},
    [FEATURE_KEY.VALIDATE_PRIVATE_APP_ACCESS]: { shouldNotSkipPublicApp: true },
    [FEATURE_KEY.VALIDATE_RELEASED_APP_ACCESS]: {},
    [FEATURE_KEY.GET_ASSOCIATED_TABLES]: {},
    [FEATURE_KEY.GET_ONE]: {},
    [FEATURE_KEY.GET_BY_SLUG]: {},
    [FEATURE_KEY.RELEASE]: {
      auditLogsKey: 'APP_RELEASE',
      shouldNotSkipPublicApp: true,
    },
    [FEATURE_KEY.GET_APP_AUTHENTICATION_CONFIG]: {},
  },
};
