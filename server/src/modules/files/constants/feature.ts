import { FeaturesConfig } from '../types';
import { FEATURE_KEY } from './index';
import { MODULES } from '@modules/app/constants/modules';

export const FEATURES: FeaturesConfig = {
  [MODULES.FILE]: {
    [FEATURE_KEY.GET]: {},
  },
};
