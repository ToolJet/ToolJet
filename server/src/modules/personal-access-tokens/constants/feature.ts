import { FEATURE_KEY } from './index';
import { MODULES } from '@modules/app/constants/modules';
import { FeaturesConfig } from '../types';

export const FEATURES: FeaturesConfig = {
  [MODULES.PERSONAL_ACCESS_TOKENS]: {
    [FEATURE_KEY.CREATE_PAT]: {},
    [FEATURE_KEY.LIST_PATS]: {},
    [FEATURE_KEY.DELETE_PAT]: {},
  },
};
