import { FEATURE_KEY } from '.';
import { MODULES } from '@modules/app/constants/modules';
import { FeaturesConfig } from '../types';
import { LICENSE_FIELD } from '@modules/licensing/constants';

export const FEATURES: FeaturesConfig = {
  [MODULES.GIT_SYNC]: {
    [FEATURE_KEY.SAVE_PROVIDER_CONFIGS]: { license: LICENSE_FIELD.GIT_SYNC },
    [FEATURE_KEY.FINALIZE_CONFIGS]: { license: LICENSE_FIELD.GIT_SYNC },
    [FEATURE_KEY.SAVE_ENV_PROVIDER_CONFIGS]: { license: LICENSE_FIELD.GIT_SYNC },
    [FEATURE_KEY.ENABLE_AUTO_SYNC]: { license: LICENSE_FIELD.GIT_SYNC },
    [FEATURE_KEY.DISABLE_AUTO_SYNC]: { license: LICENSE_FIELD.GIT_SYNC },
    [FEATURE_KEY.ROTATE_AUTO_SYNC_SECRET]: { license: LICENSE_FIELD.GIT_SYNC },
    [FEATURE_KEY.GET_AUTO_SYNC_STATUS]: {},
    [FEATURE_KEY.GET_AUTO_SYNC_EVENTS]: { license: LICENSE_FIELD.GIT_SYNC },
  },
};
