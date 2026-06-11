import { FEATURE_KEY } from './index';
import { MODULES } from '@modules/app/constants/modules';
import { FeaturesConfig } from '../types';
import { LICENSE_FIELD } from '@modules/licensing/constants';

export const FEATURES: FeaturesConfig = {
  [MODULES.NEW_MODULE]: {
    [FEATURE_KEY.SOME_FEATURE]: {
      license: LICENSE_FIELD.VALID,
    },
  },
};
