import { FEATURE_KEY } from '.';
import { MODULES } from '@modules/app/constants/modules';
import { LICENSE_FIELD } from '@modules/licensing/constants';
import { FeaturesConfig } from '../types';

export const FEATURES: FeaturesConfig = {
  [MODULES.MODULES]: {
    [FEATURE_KEY.CREATE_MODULE]: {
      license: LICENSE_FIELD.VALID,
    },
    [FEATURE_KEY.DELETE_MODULE]: {
      license: LICENSE_FIELD.VALID,
    },
    [FEATURE_KEY.UPDATE_MODULE]: {
      license: LICENSE_FIELD.VALID,
    },
    [FEATURE_KEY.IMPORT_MODULE]: {
      license: LICENSE_FIELD.VALID,
    },
    [FEATURE_KEY.EXORT_MODULE]: {
      license: LICENSE_FIELD.VALID,
    },
    [FEATURE_KEY.CLONE_MODULE]: {
      license: LICENSE_FIELD.VALID,
    },
  },
};
