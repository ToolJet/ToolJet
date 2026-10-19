import { FEATURE_KEY } from './index';
import { MODULES } from '@modules/app/constants/modules';
import { FeaturesConfig } from '../types';

export const FEATURES: FeaturesConfig = {
  [MODULES.ROOT]: {
    [FEATURE_KEY.HEALTH]: {
      isPublic: true,
    },
    [FEATURE_KEY.ROOT]: {
      isPublic: true,
    },
    [FEATURE_KEY.MIGRATION_STATUS]: {
      isPublic: true,
      skipAuditLogs: true,
    },
    [FEATURE_KEY.MIGRATION_RUNS]: {
      isSuperAdminFeature: true,
      skipAuditLogs: true,
    },
    [FEATURE_KEY.MIGRATION_RETRY]: {
      isSuperAdminFeature: true,
    },
  },
};
