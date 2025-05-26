import { FEATURE_KEY } from '.';
import { MODULES } from '@modules/app/constants/modules';
import { FeaturesConfig } from '../types';
import { LICENSE_FIELD } from '@modules/licensing/constants';

export const FEATURES: FeaturesConfig = {
  [MODULES.APP_GIT]: {
    [FEATURE_KEY.GIT_CREATE_APP]: { license: LICENSE_FIELD.VALID },
    [FEATURE_KEY.GIT_GET_APP]: { license: LICENSE_FIELD.VALID },
    [FEATURE_KEY.GIT_GET_APPS]: { license: LICENSE_FIELD.VALID },
    [FEATURE_KEY.GIT_GET_APP_CONFIG]: { license: LICENSE_FIELD.VALID },
    [FEATURE_KEY.GIT_SYNC_APP]: { license: LICENSE_FIELD.VALID },
    [FEATURE_KEY.GIT_UPDATE_APP]: { license: LICENSE_FIELD.VALID },
    [FEATURE_KEY.GIT_APP_VERSION_RENAME]: { license: LICENSE_FIELD.VALID },
  },
};
