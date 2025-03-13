import { FEATURE_KEY } from './index';
import { MODULES } from '@modules/app/constants/modules';
import { FeaturesConfig } from '../types';
import { LICENSE_FIELD } from '@modules/licensing/constants';

export const FEATURES: FeaturesConfig = {
  [MODULES.APP_ENVIRONMENTS]: {
    [FEATURE_KEY.INIT]: {},
    [FEATURE_KEY.POST_ACTION]: {},
    [FEATURE_KEY.GET_ALL]: {},
    [FEATURE_KEY.GET_DEFAULT]: {},
    [FEATURE_KEY.GET_VERSIONS_BY_ENVIRONMENT]: {},
    [FEATURE_KEY.CREATE]: { license: LICENSE_FIELD.VALID },
    [FEATURE_KEY.UPDATE]: { license: LICENSE_FIELD.VALID },
    [FEATURE_KEY.DELETE]: { license: LICENSE_FIELD.VALID },
    [FEATURE_KEY.GET_BY_ID]: {},
  },
};
