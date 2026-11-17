import { FEATURE_KEY } from './index';
import { MODULES } from '@modules/app/constants/modules';
import { LICENSE_FIELD } from '@modules/licensing/constants';
import { isCodeModeAllowed } from '@modules/code-mode-source/constants';
import { FeaturesConfig } from '../types';

// Apps built in code keep their code in a library, so where Code mode is allowed the route gate stays open and the
// controller checks the license per library: a Code mode app's library is open on every plan, any other needs it.
const gated = isCodeModeAllowed() ? {} : { license: LICENSE_FIELD.CUSTOM_COMPONENT_LIBRARIES };

export const FEATURES: FeaturesConfig = {
  [MODULES.CUSTOM_COMPONENT_LIBRARIES]: {
    [FEATURE_KEY.CREATE_LIBRARY]: gated,
    [FEATURE_KEY.FIND_OR_CREATE_LIBRARY]: gated,
    [FEATURE_KEY.GET_LIBRARY]: gated,
    [FEATURE_KEY.DELETE_LIBRARY]: gated,
    [FEATURE_KEY.LIST_LIBRARIES]: {},
    [FEATURE_KEY.UPLOAD_DEV_BUNDLE]: gated,
    [FEATURE_KEY.STREAM_DEV_BUNDLE]: gated,
    [FEATURE_KEY.PUBLISH_REVISION]: gated,
    [FEATURE_KEY.SERVE_BUNDLE]: {},
  },
};
