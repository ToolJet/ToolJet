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
    [FEATURE_KEY.GENERATE_PAT]: {
      license: LICENSE_FIELD.EXTERNAL_API,
      isPublic: true,
    },
    [FEATURE_KEY.VALIDATE_PAT_SESSION]: {
      license: LICENSE_FIELD.EXTERNAL_API,
      isPublic: true,
    },
  },
};
