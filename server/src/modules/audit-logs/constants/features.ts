import { FEATURE_KEY } from './index';
import { MODULES } from '@modules/app/constants/modules';
import { LICENSE_FIELD } from '@modules/licensing/constants';
import { FeaturesConfig } from '../types';

export const FEATURES: FeaturesConfig = {
  [MODULES.AUDIT_LOGS]: {
    [FEATURE_KEY.VIEW_LOGS]: {
      license: LICENSE_FIELD.AUDIT_LOGS,
    },
  },
};
