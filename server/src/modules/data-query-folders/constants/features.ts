import { FEATURE_KEY } from './index';
import { MODULES } from '@modules/app/constants/modules';
import { FeaturesConfig } from '../types';

export const FEATURES: FeaturesConfig = {
  [MODULES.DATA_QUERY_FOLDERS]: {
    [FEATURE_KEY.CREATE]: {},
    [FEATURE_KEY.GET]: {},
    [FEATURE_KEY.UPDATE]: {},
    [FEATURE_KEY.DELETE]: {},
    [FEATURE_KEY.REORDER]: {},
  },
};
