import { FEATURE_KEY } from '.';
import { MODULES } from '@modules/app/constants/modules';
import { FeaturesConfig } from '../types';

export const FEATURES: FeaturesConfig = {
  [MODULES.SMTP]: {
    [FEATURE_KEY.GET]: {},
    [FEATURE_KEY.UPDATE]: {},
    [FEATURE_KEY.UPDATE_ENV]: {},
    [FEATURE_KEY.UPDATE_STATUS]: {},
  },
};
