import { FEATURE_KEY } from './index';
import { MODULES } from '@modules/app/constants/modules';
import { FeaturesConfig } from '../types';

export const FEATURES: FeaturesConfig = {
  [MODULES.IMPORT_EXPORT_RESOURCES]: {
    [FEATURE_KEY.APP_RESOURCE_EXPORT]: {},
    [FEATURE_KEY.APP_RESOURCE_IMPORT]: {},
    [FEATURE_KEY.APP_RESOURCE_CLONE]: {},
  },
};
