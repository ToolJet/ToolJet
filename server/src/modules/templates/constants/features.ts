import { FEATURE_KEY } from '.';
import { FeaturesConfig } from '../type';
import { MODULES } from '@modules/app/constants/modules';

export const FEATURES: FeaturesConfig = {
  [MODULES.TEMPLATES]: {
    [FEATURE_KEY.CREATE_LIBRARY_APP]: {},
    [FEATURE_KEY.CREATE_SAMPLE_APP]: {},
    [FEATURE_KEY.CREATE_SAMPLE_ONBOARD_APP]: {},
    [FEATURE_KEY.FETCH_TEMPLATES_LIST]: {},
  },
};
