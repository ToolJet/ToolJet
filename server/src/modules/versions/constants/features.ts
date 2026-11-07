import { FEATURE_KEY } from './index';
import { MODULES } from '@modules/app/constants/modules';
import { FeaturesConfig } from '../types';
import { LICENSE_FIELD } from '@modules/licensing/constants';

export const FEATURES: FeaturesConfig = {
  [MODULES.VERSION]: {
    // Public-app skip covers reads only; mutations keep the permission check.
    [FEATURE_KEY.GET]: {},
    [FEATURE_KEY.GET_ONE]: {},
    [FEATURE_KEY.CREATE]: {
      auditLogsKey: 'APP_UPDATE',
      shouldNotSkipPublicApp: true,
    },
    [FEATURE_KEY.DELETE]: {
      auditLogsKey: 'APP_UPDATE',
      shouldNotSkipPublicApp: true,
    },
    [FEATURE_KEY.UPDATE]: {
      auditLogsKey: 'APP_UPDATE',
      shouldNotSkipPublicApp: true,
    },
    [FEATURE_KEY.UPDATE_SETTINGS]: {
      auditLogsKey: 'APP_UPDATE',
      shouldNotSkipPublicApp: true,
    },
    [FEATURE_KEY.PROMOTE]: {
      license: LICENSE_FIELD.VALID,
      auditLogsKey: 'APP_PROMOTE',
      shouldNotSkipPublicApp: true,
    },
    [FEATURE_KEY.CREATE_COMPONENTS]: { shouldNotSkipPublicApp: true },
    [FEATURE_KEY.UPDATE_COMPONENTS]: { shouldNotSkipPublicApp: true },
    [FEATURE_KEY.UPDATE_COMPONENT_LAYOUT]: { shouldNotSkipPublicApp: true },
    [FEATURE_KEY.DELETE_COMPONENTS]: { shouldNotSkipPublicApp: true },
    [FEATURE_KEY.CREATE_PAGES]: { shouldNotSkipPublicApp: true },
    [FEATURE_KEY.CLONE_PAGES]: { shouldNotSkipPublicApp: true },
    [FEATURE_KEY.CLONE_GROUP]: { shouldNotSkipPublicApp: true },
    [FEATURE_KEY.UPDATE_PAGES]: { shouldNotSkipPublicApp: true },
    [FEATURE_KEY.DELETE_PAGE]: { shouldNotSkipPublicApp: true },
    [FEATURE_KEY.REORDER_PAGES]: { shouldNotSkipPublicApp: true },
    [FEATURE_KEY.GET_EVENTS]: {},
    [FEATURE_KEY.CREATE_EVENT]: { shouldNotSkipPublicApp: true },
    [FEATURE_KEY.UPDATE_EVENT]: { shouldNotSkipPublicApp: true },
    [FEATURE_KEY.DELETE_EVENT]: { shouldNotSkipPublicApp: true },
    [FEATURE_KEY.APP_VERSION_CREATE]: { shouldNotSkipPublicApp: true },
    [FEATURE_KEY.APP_VERSION_DELETE]: { shouldNotSkipPublicApp: true },
    [FEATURE_KEY.APP_VERSION_UPDATE]: { shouldNotSkipPublicApp: true },
    [FEATURE_KEY.APP_DRAFT_VERSION_CREATE]: { shouldNotSkipPublicApp: true },
  },
};
