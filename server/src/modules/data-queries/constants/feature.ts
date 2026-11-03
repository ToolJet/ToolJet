import { FEATURE_KEY } from './index';
import { MODULES } from '@modules/app/constants/modules';
import { FeaturesConfig } from '../types';

export const FEATURES: FeaturesConfig = {
  [MODULES.DATA_QUERY]: {
    [FEATURE_KEY.GET]: {},
    // Public-app skip covers reads/run only; mutations keep the permission check.
    [FEATURE_KEY.CREATE]: { shouldNotSkipPublicApp: true },
    [FEATURE_KEY.UPDATE]: { shouldNotSkipPublicApp: true },
    [FEATURE_KEY.DELETE]: { shouldNotSkipPublicApp: true },
    [FEATURE_KEY.UPDATE_DATA_SOURCE]: { shouldNotSkipPublicApp: true },
    [FEATURE_KEY.UPDATE_ONE]: { shouldNotSkipPublicApp: true },
    [FEATURE_KEY.RUN_EDITOR]: {
      auditLogsKey: 'DATA_QUERY_RUN',
      shouldNotSkipPublicApp: true,
    },
    [FEATURE_KEY.RUN_VIEWER]: {
      auditLogsKey: 'DATA_QUERY_RUN',
    },
    [FEATURE_KEY.PREVIEW]: {
      auditLogsKey: 'DATA_QUERY_RUN',
      shouldNotSkipPublicApp: true,
    },
    [FEATURE_KEY.LIST_TABLES]: {},
  },
};
