import { FEATURE_KEY } from './index';
import { MODULES } from '@modules/app/constants/modules';
import { FeaturesConfig } from '../types';

export const FEATURES: FeaturesConfig = {
  [MODULES.APP]: {
    [FEATURE_KEY.CREATE]: {},
    [FEATURE_KEY.UPDATE]: {},
    [FEATURE_KEY.UPDATE_ICON]: {},
    [FEATURE_KEY.DELETE]: {},
    [FEATURE_KEY.GET]: {},
    [FEATURE_KEY.VALIDATE_PRIVATE_APP_ACCESS]: { shouldNotSkipPublicApp: true },
    [FEATURE_KEY.VALIDATE_RELEASED_APP_ACCESS]: {},
    [FEATURE_KEY.GET_ASSOCIATED_TABLES]: {},
    [FEATURE_KEY.GET_ONE]: {},
    [FEATURE_KEY.GET_BY_SLUG]: {},
    [FEATURE_KEY.RELEASE]: {
      auditLogsKey: FEATURE_KEY.UPDATE,
    },
  },
};
