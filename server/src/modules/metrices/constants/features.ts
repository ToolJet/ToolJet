import { FEATURE_KEY } from './index';
import { MODULES } from '@modules/app/constants/modules';
import { FeaturesConfig } from '../types';

export const FEATURES: FeaturesConfig = {
  [MODULES.METRICS]: {
    [FEATURE_KEY.GET]: {
      isPublic: true,
    },
  },
};
