import { MODULES } from '@modules/app/constants/modules';
import { LICENSE_FIELD } from '@modules/licensing/constants';
import { FeaturesConfig } from '../types';
import { FEATURE_KEY } from '.';

const licensed = { license: LICENSE_FIELD.APP_USAGE_ANALYTICS };

export const FEATURES: FeaturesConfig = {
  [MODULES.APP_USAGE_ANALYTICS]: {
    // Status is not licence-gated: the frontend reads it to decide whether to show the page at all.
    [FEATURE_KEY.GET_STATUS]: {},
    [FEATURE_KEY.GET_WORKSPACE_SUMMARY]: licensed,
    [FEATURE_KEY.GET_WORKSPACE_ACTIVE_USERS]: licensed,
    [FEATURE_KEY.GET_WORKSPACE_APPS]: licensed,
    [FEATURE_KEY.GET_APP_SUMMARY]: licensed,
    [FEATURE_KEY.GET_APP_ACTIVE_USERS]: licensed,
    [FEATURE_KEY.GET_APP_USERS]: licensed,
  },
};
