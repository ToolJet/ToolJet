import { FEATURE_KEY } from './index';
import { MODULES } from '@modules/app/constants/modules';
import { FeaturesConfig } from '../types';

export const FEATURES: FeaturesConfig = {
  [MODULES.CODE_PAGE_SECURITY]: {
    [FEATURE_KEY.GET_CODE_PAGE_SECURITY]: {},
    [FEATURE_KEY.UPDATE_CODE_PAGE_SECURITY]: { auditLogsKey: 'CODE_PAGE_SECURITY_UPDATE' },
  },
};
