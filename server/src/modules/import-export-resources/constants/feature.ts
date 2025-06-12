import { FEATURE_KEY } from './index';
import { MODULES } from '@modules/app/constants/modules';
import { FeaturesConfig } from '../types';

export const FEATURES: FeaturesConfig = {
  [MODULES.IMPORT_EXPORT_RESOURCES]: {
    [FEATURE_KEY.APP_RESOURCE_EXPORT]: {
      auditLogsKey: 'APP_EXPORT',
    },
    [FEATURE_KEY.APP_RESOURCE_IMPORT]: {
      auditLogsKey: 'APP_IMPORT',
    },
    [FEATURE_KEY.APP_RESOURCE_CLONE]: {
      auditLogsKey: 'APP_CLONE',
    },
  },
};
