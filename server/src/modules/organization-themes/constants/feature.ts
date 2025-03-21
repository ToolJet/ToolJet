import { FEATURE_KEY } from '.';
import { MODULES } from '@modules/app/constants/modules';
import { FeaturesConfig } from '../types';
import { LICENSE_FIELD } from '@modules/licensing/constants';

export const FEATURES: FeaturesConfig = {
  [MODULES.ORGANIZATION_THEMES]: {
    [FEATURE_KEY.THEMES_CREATE]: { license: LICENSE_FIELD.CUSTOM_THEMES },
    [FEATURE_KEY.THEMES_DELETE]: { license: LICENSE_FIELD.CUSTOM_THEMES },
    [FEATURE_KEY.THEMES_GET_ALL]: {},
    [FEATURE_KEY.THEMES_UPDATE_DEFAULT]: { license: LICENSE_FIELD.CUSTOM_THEMES },
    [FEATURE_KEY.THEMES_UPDATE_DEFINITION]: { license: LICENSE_FIELD.CUSTOM_THEMES },
    [FEATURE_KEY.THEMES_UPDATE_NAME]: { license: LICENSE_FIELD.CUSTOM_THEMES },
  },
};
