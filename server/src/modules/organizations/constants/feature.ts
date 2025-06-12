import { FEATURE_KEY } from '.';
import { MODULES } from '@modules/app/constants/modules';
import { FeaturesConfig } from '../types';

export const FEATURES: FeaturesConfig = {
  [MODULES.ORGANIZATIONS]: {
    [FEATURE_KEY.CHECK_UNIQUE]: {},
    [FEATURE_KEY.GET]: {
      isPublic: true,
    },
    [FEATURE_KEY.WORKSPACE_ARCHIVE]: {
      auditLogsKey: 'WORKSPACE_ARCHIVE',
    },
    [FEATURE_KEY.WORKSPACE_UNARCHIVE]: {
      auditLogsKey: 'WORKSPACE_UNARCHIVE',
    },
    [FEATURE_KEY.UPDATE]: {
      auditLogsKey: 'WORKSPACE_UPDATE',
    },
    [FEATURE_KEY.CREATE]: {
      auditLogsKey: 'WORKSPACE_CREATE',
    },
    [FEATURE_KEY.CHECK_UNIQUE_ONBOARDING]: {
      isPublic: true,
    },
    [FEATURE_KEY.SET_DEFAULT]: {},
  },
};
