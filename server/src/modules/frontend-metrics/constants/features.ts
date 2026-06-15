import { FEATURE_KEY } from './index';
import { MODULES } from '@modules/app/constants/modules';
import { FeaturesConfig } from '../types';

export const FEATURES: FeaturesConfig = {
  [MODULES.FRONTEND_METRICS]: {
    [FEATURE_KEY.INGEST]: {
      // Requires a valid auth session — not fully public
      isPublic: false,
    },
  },
};
