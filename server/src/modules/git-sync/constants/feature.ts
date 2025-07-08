import { FEATURE_KEY } from '.';
import { MODULES } from '@modules/app/constants/modules';
import { FeaturesConfig } from '../types';
import { LICENSE_FIELD } from '@modules/licensing/constants';

export const FEATURES: FeaturesConfig = {
  [MODULES.GIT_SYNC]: {
    [FEATURE_KEY.GET_ORGANIZATION_GIT]: {},
    [FEATURE_KEY.GET_ORGANIZATION_GIT_STATUS]: {},
    [FEATURE_KEY.CREATE_ORGANIZATION_GIT]: { license: LICENSE_FIELD.GIT_SYNC },
    [FEATURE_KEY.SAVE_PROVIDER_CONFIGS]: { license: LICENSE_FIELD.GIT_SYNC },
    [FEATURE_KEY.FINALIZE_CONFIGS]: { license: LICENSE_FIELD.GIT_SYNC },
    [FEATURE_KEY.UPDATE_PROVIDER_CONFIGS]: { license: LICENSE_FIELD.GIT_SYNC },
    [FEATURE_KEY.UPDATE_ORGANIZATION_GIT_STATUS]: { license: LICENSE_FIELD.GIT_SYNC },
    [FEATURE_KEY.DELETE_ORGANIZATION_GIT_CONFIGS]: { license: LICENSE_FIELD.GIT_SYNC },
  },
};
