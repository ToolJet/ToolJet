import { FEATURE_KEY, isCodeModeAllowed } from './index';
import { MODULES } from '@modules/app/constants/modules';
import { LICENSE_FIELD } from '@modules/licensing/constants';
import { FeaturesConfig } from '../types';

// The dev track upload and publish follow the library routes' gate (custom-component-libraries/constants/feature.ts).
const devTrack = isCodeModeAllowed() ? {} : { license: LICENSE_FIELD.CUSTOM_COMPONENT_LIBRARIES };
// A public app skips feature checks unless the feature says otherwise; its source is never public.
const checked = { shouldNotSkipPublicApp: true };

export const FEATURES: FeaturesConfig = {
  [MODULES.CODE_MODE_SOURCE]: {
    [FEATURE_KEY.GET_SOURCE]: checked,
    [FEATURE_KEY.WRITE_SOURCE]: checked,
    [FEATURE_KEY.IMPORT_SOURCE]: checked,
    [FEATURE_KEY.UPLOAD_DEV_BUNDLE]: { ...devTrack, ...checked },
    [FEATURE_KEY.LIST_REVISIONS]: checked,
    [FEATURE_KEY.PUBLISH_CODE]: { ...devTrack, ...checked },
    // The CLI tarball this server was built with: public, like the frontend's own assets.
    [FEATURE_KEY.DOWNLOAD_CLI]: { isPublic: true },
  },
};
