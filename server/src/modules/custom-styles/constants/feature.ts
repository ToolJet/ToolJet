import { FEATURE_KEY } from './index';
import { MODULES } from '@modules/app/constants/modules';
import { FeaturesConfig } from '../types';
import { LICENSE_FIELD } from '@modules/licensing/constants';

export const FEATURES: FeaturesConfig = {
  [MODULES.CUSTOM_STYLES]: {
    [FEATURE_KEY.GET_CUSTOM_STYLES]: {
      license: LICENSE_FIELD.CUSTOM_STYLE,
    },
    [FEATURE_KEY.GET_CUSTOM_STYLES_FOR_APP]: {
      license: LICENSE_FIELD.CUSTOM_STYLE,
    },
    [FEATURE_KEY.GET_CUSTOM_STYLES_FROM_APP]: {
      license: LICENSE_FIELD.CUSTOM_STYLE,
      isPublic: true,
    },
    [FEATURE_KEY.SAVE_CUSTOM_STYLES]: {
      license: LICENSE_FIELD.CUSTOM_STYLE,
    },
  },
};
