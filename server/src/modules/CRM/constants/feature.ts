import { FEATURE_KEY } from '../constants';
import { MODULES } from '@modules/app/constants/modules';
import { FeaturesConfig } from '../types';

export const FEATURES: FeaturesConfig = {
  [MODULES.CRM]: {
    [FEATURE_KEY.CRM_PUSH]: {
      isPublic: true,
    },
  },
};
