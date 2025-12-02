import { MODULES } from '@modules/app/constants/modules';
import { FeaturesConfig } from '../types';
import { LICENSE_FIELD } from '@modules/licensing/constants';
import { FEATURE_KEY } from '.';

export const FEATURES: FeaturesConfig = {
  [MODULES.WHITE_LABELLING]: {
    [FEATURE_KEY.GET]: { isPublic: true },
    [FEATURE_KEY.UPDATE]: { license: LICENSE_FIELD.WHITE_LABEL },
    [FEATURE_KEY.GET_ORGANIZATION_WHITE_LABELS]: { license: LICENSE_FIELD.WHITE_LABEL },
    [FEATURE_KEY.UPDATE_ORGANIZATION_WHITE_LABELS]: { license: LICENSE_FIELD.WHITE_LABEL },
  },
};
