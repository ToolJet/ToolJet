import { FEATURE_KEY } from './index';
import { MODULES } from '@modules/app/constants/modules';
import { FeaturesConfig } from '../types';

export const FEATURES: FeaturesConfig = {
  [MODULES.PERSONAL_ACCESS_TOKENS]: {
    [FEATURE_KEY.CREATE_PAT]: {},
    [FEATURE_KEY.LIST_PATS]: {},
    [FEATURE_KEY.DELETE_PAT]: {},
    [FEATURE_KEY.VALIDATE_PAT]: {},
    [FEATURE_KEY.CREATE_PAT_SESSION]: {},
    [FEATURE_KEY.CREATE_AI_RENDER_SESSION]: {},
    // The CLI holds no credential yet when it starts and polls; approving needs a browser session.
    [FEATURE_KEY.START_DEVICE_LOGIN]: { isPublic: true },
    [FEATURE_KEY.POLL_DEVICE_LOGIN]: { isPublic: true },
    [FEATURE_KEY.LOOKUP_DEVICE_LOGIN]: {},
    [FEATURE_KEY.APPROVE_DEVICE_LOGIN]: {},
  },
};
