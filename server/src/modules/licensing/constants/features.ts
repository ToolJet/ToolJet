import { FeaturesConfig } from '../types';
import { FEATURE_KEY, LICENSE_FIELD } from './index';
import { MODULES } from '@modules/app/constants/modules';

export const FEATURES: FeaturesConfig = {
  [MODULES.LICENSING]: {
    [FEATURE_KEY.GET_ACCESS]: {},
    [FEATURE_KEY.GET_PLANS]: {
      isPublic: true,
    },
    [FEATURE_KEY.GET_LICENSE]: {},
    [FEATURE_KEY.GET_DOMAINS]: {},
    [FEATURE_KEY.GET_TERMS]: {},
    [FEATURE_KEY.UPDATE_LICENSE]: {},
    [FEATURE_KEY.GET_ORGANIZATION_LIMITS]: {},
    [FEATURE_KEY.GET_APP_LIMITS]: {},
    [FEATURE_KEY.CHECK_AUDIT_LOGS_LICENSE]: {
      license: LICENSE_FIELD.AUDIT_LOGS,
    },
    [FEATURE_KEY.GET_AUDIT_LOGS_MAX_DURATION]: {
      license: LICENSE_FIELD.AUDIT_LOGS,
    },
    [FEATURE_KEY.GET_WORKFLOW_LIMITS]: {},
    [FEATURE_KEY.GET_USER_LIMITS]: {},
  },
};
