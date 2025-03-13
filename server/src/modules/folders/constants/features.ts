import { FEATURE_KEY } from './index';
import { MODULES } from '@modules/app/constants/modules';
import { FeaturesConfig } from '../types';

export const FEATURES: FeaturesConfig = {
  [MODULES.FOLDER]: {
    [FEATURE_KEY.CREATE_FOLDER]: {},
    [FEATURE_KEY.UPDATE_FOLDER]: {},
    [FEATURE_KEY.DELETE_FOLDER]: {},
  },
};
