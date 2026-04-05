import { FEATURE_KEY } from './index';
import { MODULES } from '@modules/app/constants/modules';
import { FeaturesConfig } from '../types';
import { LICENSE_FIELD } from '@modules/licensing/constants';

export const FEATURES: FeaturesConfig = {
  [MODULES.DATA_QUERY_FOLDERS]: {
    [FEATURE_KEY.CREATE]: { license: LICENSE_FIELD.QUERY_FOLDERS },
    [FEATURE_KEY.GET]: {},
    [FEATURE_KEY.UPDATE]: { license: LICENSE_FIELD.QUERY_FOLDERS },
    [FEATURE_KEY.DELETE]: { license: LICENSE_FIELD.QUERY_FOLDERS },
    [FEATURE_KEY.REORDER]: { license: LICENSE_FIELD.QUERY_FOLDERS },
  },
};
