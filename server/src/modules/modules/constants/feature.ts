import { FEATURE_KEY } from '.';
import { MODULES } from '@modules/app/constants/modules';
import { LICENSE_FIELD } from '@modules/licensing/constants';
import { FeaturesConfig } from '../types';

export const FEATURES: FeaturesConfig = {
  [MODULES.MODULES]: {
    [FEATURE_KEY.CREATE_MODULE]: {
      license: LICENSE_FIELD.VALID,
    },
  },
};
