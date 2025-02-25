import { FeaturesConfig } from '../types';
import { FEATURE_KEY } from './index';
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
    [FEATURE_KEY.CHECK_AUDIT_LOGS_LICENSE]: {},
    [FEATURE_KEY.GET_AUDIT_LOGS_MAX_DURATION]: {},
    [FEATURE_KEY.GET_WORKFLOW_LIMITS]: {},
    [FEATURE_KEY.GET_USER_LIMITS]: {},
  },
};
