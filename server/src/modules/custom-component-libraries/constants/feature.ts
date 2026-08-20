import { FEATURE_KEY } from './index';
import { MODULES } from '@modules/app/constants/modules';
import { LICENSE_FIELD } from '@modules/licensing/constants';
import { FeaturesConfig } from '../types';

const gated = { license: LICENSE_FIELD.CUSTOM_COMPONENT_LIBRARIES };

export const FEATURES: FeaturesConfig = {
  [MODULES.CUSTOM_COMPONENT_LIBRARIES]: {
    [FEATURE_KEY.CREATE_LIBRARY]: gated,
    [FEATURE_KEY.GET_LIBRARY]: gated,
    [FEATURE_KEY.DELETE_LIBRARY]: gated,
    [FEATURE_KEY.LIST_LIBRARIES]: gated,
    [FEATURE_KEY.VALIDATE_TOKEN]: gated,
    [FEATURE_KEY.UPLOAD_DEV_BUNDLE]: gated,
    [FEATURE_KEY.PUBLISH_REVISION]: gated,
    [FEATURE_KEY.SERVE_BUNDLE]: {},
    [FEATURE_KEY.CREATE_CLI_TOKEN]: {},
    [FEATURE_KEY.LIST_CLI_TOKENS]: {},
    [FEATURE_KEY.DELETE_CLI_TOKEN]: {},
  },
};
