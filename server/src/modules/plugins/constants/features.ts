import { FEATURE_KEY } from '.';
import { MODULES } from '@modules/app/constants/modules';
import { FeaturesConfig } from '../types';

export const FEATURES: FeaturesConfig = {
  [MODULES.PLUGINS]: {
    [FEATURE_KEY.DELETE]: {},
    [FEATURE_KEY.GET]: {},
    [FEATURE_KEY.GET_ONE]: {},
    [FEATURE_KEY.INSTALL]: {},
    [FEATURE_KEY.RELOAD]: {},
    [FEATURE_KEY.UPDATE]: {},
  },
};
