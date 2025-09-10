import { FEATURE_KEY } from './index';
import { MODULES } from '@modules/app/constants/modules';
import { LICENSE_FIELD } from '@modules/licensing/constants';

export const FEATURES = {
  [MODULES.APP_HISTORY]: {
    [FEATURE_KEY.LIST_HISTORY]: {
      license: LICENSE_FIELD.APP_HISTORY,
    },
    [FEATURE_KEY.GET_HISTORY_ENTRY]: {
      license: LICENSE_FIELD.APP_HISTORY,
    },
    [FEATURE_KEY.RESTORE_HISTORY]: {
      license: LICENSE_FIELD.APP_HISTORY,
      auditLogsKey: 'APP_HISTORY_RESTORE',
    },
    [FEATURE_KEY.UPDATE_DESCRIPTION]: {
      license: LICENSE_FIELD.APP_HISTORY,
    },
  },
};
