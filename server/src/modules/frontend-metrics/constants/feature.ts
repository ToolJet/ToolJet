import { FeaturesConfig } from '../types';
import { FEATURE_KEY } from './index';
import { MODULES } from '@modules/app/constants/modules';

export const FEATURES: FeaturesConfig = {
  [MODULES.FRONTEND_METRICS]: {
    [FEATURE_KEY.INGEST]: {
      isPublic: false,
    },
  },
};
