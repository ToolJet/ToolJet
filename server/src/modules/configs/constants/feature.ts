import { FEATURE_KEY } from '.';
import { MODULES } from '@modules/app/constants/modules';
import { FeaturesConfig } from '../types';

export const FEATURES: FeaturesConfig = {
  [MODULES.CONFIGS]: {
    [FEATURE_KEY.GET_PUBLIC_CONFIGS]: {
      isPublic: true,
    },
    [FEATURE_KEY.GET_WIDGETS]: {
      isPublic: true,
    },
  },
};
