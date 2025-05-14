import { FEATURE_KEY } from './index';
import { MODULES } from '@modules/app/constants/modules';
import { FeaturesConfig } from '../types';

export const FEATURES: FeaturesConfig = {
  [MODULES.ORGANIZATION_CONSTANT]: {
    [FEATURE_KEY.GET]: {},
    [FEATURE_KEY.GET_PUBLIC]: {
      isPublic: true,
    },
    [FEATURE_KEY.GET_FROM_APP]: {},
    [FEATURE_KEY.GET_FROM_ENVIRONMENT]: {},
    [FEATURE_KEY.CREATE]: {},
    [FEATURE_KEY.UPDATE]: {},
    [FEATURE_KEY.DELETE]: {},
    [FEATURE_KEY.GET_SECRETS]: {},
    [FEATURE_KEY.GET_DECRYPTED_CONSTANTS]: {},
  },
};
