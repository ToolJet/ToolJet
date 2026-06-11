import { FEATURE_KEY } from './index';
import { MODULES } from '@modules/app/constants/modules';
import { FeaturesConfig } from '../types';

export const FEATURES: FeaturesConfig = {
  [MODULES.METADATA]: {
    [FEATURE_KEY.GET_METADATA]: {
      isPublic: true,
    },
  },
};
