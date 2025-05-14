import { FEATURE_KEY } from '.';
import { MODULES } from '@modules/app/constants/modules';
import { FeaturesConfig } from '../types';

export const FEATURES: FeaturesConfig = {
  [MODULES.ORGANIZATIONS]: {
    [FEATURE_KEY.CHECK_UNIQUE]: {},
    [FEATURE_KEY.GET]: {
      isPublic: true,
    },
    [FEATURE_KEY.WORKSPACE_STATUS_UPDATE]: {},
    [FEATURE_KEY.UPDATE]: {},
    [FEATURE_KEY.CREATE]: {},
    [FEATURE_KEY.CHECK_UNIQUE_ONBOARDING]: {
      isPublic: true,
    },
  },
};
