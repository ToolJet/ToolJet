import { FEATURE_KEY } from '.';
import { MODULES } from '@modules/app/constants/modules';
import { FeaturesConfig } from '../types';

export const FEATURES: FeaturesConfig = {
  [MODULES.SMTP]: {
    [FEATURE_KEY.GET]: {},
    [FEATURE_KEY.UPDATE]: {
      auditLogsKey: 'SMTP_PROTOCOL_UPDATE',
    },
    [FEATURE_KEY.UPDATE_ENV]: {
      auditLogsKey: 'SMTP_PROTOCOL_UPDATE',
    },
    [FEATURE_KEY.UPDATE_STATUS]: {
      auditLogsKey: 'SMTP_PROTOCOL_UPDATE',
    },
  },
};
