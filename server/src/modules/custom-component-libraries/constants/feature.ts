import { FEATURE_KEY } from './index';
import { MODULES } from '@modules/app/constants/modules';
import { FeaturesConfig } from '../types';

// ponytail: no `license:` field yet — wiring LICENSE_FIELD lands as its own commit once
// LicenseBase default behavior is verified (blind wiring could 451-block all local testing).
// Paid/EE gating is required for release (DECISIONS-2026-07-30).
export const FEATURES: FeaturesConfig = {
  [MODULES.CUSTOM_COMPONENT_LIBRARIES]: {
    [FEATURE_KEY.CREATE_LIBRARY]: {},
    [FEATURE_KEY.GET_LIBRARY]: {},
    [FEATURE_KEY.LIST_LIBRARIES]: {},
    [FEATURE_KEY.VALIDATE_TOKEN]: {},
    [FEATURE_KEY.UPLOAD_DEV_BUNDLE]: {},
    [FEATURE_KEY.PUBLISH_REVISION]: {},
    [FEATURE_KEY.SERVE_BUNDLE]: {},
    [FEATURE_KEY.CREATE_CLI_TOKEN]: {},
    [FEATURE_KEY.LIST_CLI_TOKENS]: {},
    [FEATURE_KEY.DELETE_CLI_TOKEN]: {},
  },
};
