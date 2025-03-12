import { FEATURE_KEY } from '.';
import { MODULES } from '@modules/app/constants/modules';
import { FeaturesConfig } from '../types';

export const FEATURES: FeaturesConfig = {
  [MODULES.PROFILE]: {
    [FEATURE_KEY.UPDATE_AVATAR]: {},
    [FEATURE_KEY.GET]: {},
    [FEATURE_KEY.UPDATE]: {},
    [FEATURE_KEY.UPDATE_PASSWORD]: {},
  },
};
