import { FEATURE_KEY } from './index';
import { MODULES } from '@modules/app/constants/modules';
import { LICENSE_FIELD } from '@modules/licensing/constants';
import { FeaturesConfig } from '../types';

export const FEATURES: FeaturesConfig = {
  [MODULES.INSTANCE_SETTINGS]: {
    [FEATURE_KEY.GET]: {},
    [FEATURE_KEY.CREATE]: {
      license: LICENSE_FIELD.VALID,
    },
    [FEATURE_KEY.DELETE]: {
      license: LICENSE_FIELD.VALID,
    },
    [FEATURE_KEY.UPDATE]: {
      license: LICENSE_FIELD.VALID,
    },
  },
};
