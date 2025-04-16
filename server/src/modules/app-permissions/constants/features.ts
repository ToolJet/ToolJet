import { FEATURE_KEY } from './index';
import { MODULES } from '@modules/app/constants/modules';
import { FeaturesConfig } from '../types';

export const FEATURES: FeaturesConfig = {
  [MODULES.APP_PERMISSIONS]: {
    [FEATURE_KEY.FETCH_USERS]: {},
    [FEATURE_KEY.FETCH_USER_GROUPS]: {},
  },
};
