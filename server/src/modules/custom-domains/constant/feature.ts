import { MODULES } from '@modules/app/constants/modules';
import { FeaturesConfig } from '../types';
import { LICENSE_FIELD } from '@modules/licensing/constants';
import { FEATURE_KEY } from '.';

export const FEATURES: FeaturesConfig = {
  [MODULES.CUSTOM_DOMAINS]: {
    [FEATURE_KEY.GET]: { license: LICENSE_FIELD.CUSTOM_DOMAINS },
    [FEATURE_KEY.CREATE]: { license: LICENSE_FIELD.CUSTOM_DOMAINS },
    [FEATURE_KEY.VERIFY]: { license: LICENSE_FIELD.CUSTOM_DOMAINS },
    [FEATURE_KEY.DELETE]: { license: LICENSE_FIELD.CUSTOM_DOMAINS },
    [FEATURE_KEY.STATUS]: { license: LICENSE_FIELD.CUSTOM_DOMAINS },
    [FEATURE_KEY.RESOLVE]: { isPublic: true },
  },
};
