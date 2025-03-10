import { FEATURE_KEY } from '.';
import { MODULES } from '@modules/app/constants/modules';
import { FeaturesConfig } from '../types';
import { LICENSE_FIELD } from '@modules/licensing/constants';

export const FEATURES: FeaturesConfig = {
  [MODULES.GIT_SYNC]: {
    [FEATURE_KEY.GIT_SYNC_GET_ORG_GIT]: { license: LICENSE_FIELD.GIT_SYNC },
    [FEATURE_KEY.GIT_SYNC_GET_ORG_GIT_STATUS]: { license: LICENSE_FIELD.GIT_SYNC },
    [FEATURE_KEY.GIT_SYNC_CREATE_ORG_GIT]: { license: LICENSE_FIELD.GIT_SYNC },
    [FEATURE_KEY.GIT_SYNC_UPDATE_ORG_GIT]: { license: LICENSE_FIELD.GIT_SYNC },
    [FEATURE_KEY.GIT_SYNC_FINALIZE_ORG_GIT]: { license: LICENSE_FIELD.GIT_SYNC },
    [FEATURE_KEY.GIT_SYNC_CHANGE_STATUS]: { license: LICENSE_FIELD.GIT_SYNC },
    [FEATURE_KEY.GIT_SYNC_DELETE_ORG_GIT]: { license: LICENSE_FIELD.GIT_SYNC },
  },
};
