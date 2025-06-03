import { MODULES } from '@modules/app/constants/modules';
import { LICENSE_FIELD } from '@modules/licensing/constants';
import { FEATURE_KEY } from '.';
import { FeaturesConfig } from '../types';

export const FEATURES: FeaturesConfig = {
  [MODULES.EXTERNAL_APIS]: {
    [FEATURE_KEY.GET_ALL_USERS]: {
      license: LICENSE_FIELD.EXTERNAL_API,
      isPublic: true,
    },
    [FEATURE_KEY.GET_USER]: {
      license: LICENSE_FIELD.EXTERNAL_API,
      isPublic: true,
    },
    [FEATURE_KEY.CREATE_USER]: {
      license: LICENSE_FIELD.EXTERNAL_API,
      isPublic: true,
    },
    [FEATURE_KEY.UPDATE_USER]: {
      license: LICENSE_FIELD.EXTERNAL_API,
      isPublic: true,
    },
    [FEATURE_KEY.REPLACE_USER_WORKSPACES]: {
      license: LICENSE_FIELD.EXTERNAL_API,
      isPublic: true,
    },
    [FEATURE_KEY.UPDATE_USER_WORKSPACE]: {
      license: LICENSE_FIELD.EXTERNAL_API,
      isPublic: true,
    },
    [FEATURE_KEY.GET_ALL_WORKSPACES]: {
      license: LICENSE_FIELD.EXTERNAL_API,
      isPublic: true,
    },
    [FEATURE_KEY.UPDATE_USER_ROLE]: {
      license: LICENSE_FIELD.EXTERNAL_API,
      isPublic: true,
    },
    [FEATURE_KEY.GET_ALL_WORKSPACE_APPS]: {
      license: LICENSE_FIELD.EXTERNAL_API,
      isPublic: true,
    },
    [FEATURE_KEY.IMPORT_APP]: {
      license: LICENSE_FIELD.EXTERNAL_API,
      isPublic: true,
    },
    [FEATURE_KEY.EXPORT_APP]: {
      license: LICENSE_FIELD.EXTERNAL_API,
      isPublic: true,
    },
    [FEATURE_KEY.PULL_NEW_APP]: {
      license: LICENSE_FIELD.EXTERNAL_API,
      isPublic: true,
    },
    [FEATURE_KEY.PULL_EXISTING_APP]: {
      license: LICENSE_FIELD.EXTERNAL_API,
      isPublic: true,
    },
    [FEATURE_KEY.PUSH_APP_VERSION]: {
      license: LICENSE_FIELD.EXTERNAL_API,
      isPublic: true,
    },
    [FEATURE_KEY.CREATE_ORG_GIT]: {
      license: LICENSE_FIELD.EXTERNAL_API,
      isPublic: true,
    },
    [FEATURE_KEY.AUTO_PROMOTE_APP]: {
      license: LICENSE_FIELD.EXTERNAL_API,
      isPublic: true,
    },
  },
};
