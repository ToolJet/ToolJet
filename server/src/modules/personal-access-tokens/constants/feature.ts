import { FEATURE_KEY } from './index';
import { MODULES } from '@modules/app/constants/modules';
import { FeaturesConfig } from '../types';

export const FEATURES: FeaturesConfig = {
  [MODULES.PERSONAL_ACCESS_TOKENS]: {
    [FEATURE_KEY.CREATE_PAT]: { auditLogsKey: 'PAT_CREATE' },
    [FEATURE_KEY.LIST_PATS]: {},
    [FEATURE_KEY.DELETE_PAT]: { auditLogsKey: 'PAT_REVOKE' },
    [FEATURE_KEY.VALIDATE_PAT]: {},
    [FEATURE_KEY.CREATE_PAT_SESSION]: {},
  },
};
