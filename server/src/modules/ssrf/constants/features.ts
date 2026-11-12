import { FEATURE_KEY } from './index';
import { MODULES } from '@modules/app/constants/modules';
import { FeaturesConfig } from '../types';

// No licence: super admins must be able to change SSRF protection on any plan, including an expired one.
export const FEATURES: FeaturesConfig = {
  [MODULES.SSRF]: {
    [FEATURE_KEY.GET]: {},
    [FEATURE_KEY.UPDATE]: {},
  },
};
