import { MODULES } from '@modules/app/constants/modules';
import { FeaturesConfig } from '../types';
import { LICENSE_FIELD } from '@modules/licensing/constants';
import { FEATURE_KEY } from '.';

export const FEATURES: FeaturesConfig = {
  [MODULES.WHITE_LABELLING]: {
    [FEATURE_KEY.GET]: { isSuperAdminFeature: true },
    [FEATURE_KEY.UPDATE]: { license: LICENSE_FIELD.WHITE_LABEL },
    [FEATURE_KEY.GET_WORKSPACE_SETTINGS]: {},
    [FEATURE_KEY.UPDATE_WORKSPACE_SETTINGS]: { license: LICENSE_FIELD.WHITE_LABEL },
  },
};
// check with midhun what is the use case of GET_WORKSPACE_SETTINGS and UPDATE_WORKSPACE_SETTINGS in white labelling
