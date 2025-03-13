import { FEATURE_KEY } from './index';
import { MODULES } from '@modules/app/constants/modules';
import { FeaturesConfig } from '../types';

export const FEATURES: FeaturesConfig = {
  [MODULES.DATA_QUERY]: {
    [FEATURE_KEY.GET]: {},
    [FEATURE_KEY.CREATE]: {},
    [FEATURE_KEY.UPDATE]: {},
    [FEATURE_KEY.DELETE]: {},
    [FEATURE_KEY.UPDATE_DATA_SOURCE]: {},
    [FEATURE_KEY.UPDATE_ONE]: {},
    [FEATURE_KEY.RUN_EDITOR]: {
      shouldNotSkipPublicApp: true,
    },
    [FEATURE_KEY.RUN_VIEWER]: {},
    [FEATURE_KEY.PREVIEW]: {
      shouldNotSkipPublicApp: true,
    },
  },
};
