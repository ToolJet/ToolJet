import { FEATURE_KEY } from '.';
import { MODULES } from '@modules/app/constants/modules';
import { FeaturesConfig } from '../types';

export const FEATURES: FeaturesConfig = {
  [MODULES.ORGANIZATION_USER]: {
    [FEATURE_KEY.SUGGEST_USERS]: {},
    [FEATURE_KEY.VIEW_ALL_USERS]: {},
    [FEATURE_KEY.USER_ARCHIVE_ALL]: {
      isSuperAdminFeature: true,
      auditLogsKey: 'USER_ARCHIVE',
    },
    [FEATURE_KEY.USER_ARCHIVE]: {
      auditLogsKey: 'USER_ARCHIVE',
    },
    [FEATURE_KEY.USER_INVITE]: {
      auditLogsKey: 'USER_INVITE',
    },
    [FEATURE_KEY.USER_BULK_UPLOAD]: {},
    [FEATURE_KEY.USER_UNARCHIVE]: {
      auditLogsKey: 'USER_UNARCHIVE',
    },
    [FEATURE_KEY.USER_UNARCHIVE_ALL]: {
      isSuperAdminFeature: true,
      auditLogsKey: 'USER_UNARCHIVE',
    },
    [FEATURE_KEY.USER_UPDATE]: {},
  },
};
