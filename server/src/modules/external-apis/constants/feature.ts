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
    [FEATURE_KEY.UPDATE_USER_METADATA]: {
      license: LICENSE_FIELD.EXTERNAL_API,
      isPublic: true,
    },
    [FEATURE_KEY.GET_USER_METADATA]: {
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
    [FEATURE_KEY.AUTO_RELEASE_APP]: {
      license: LICENSE_FIELD.EXTERNAL_API,
      isPublic: true,
    },
    [FEATURE_KEY.SAVE_APP_VERSION]: {
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
    [FEATURE_KEY.CREATE_GROUP]: {
      license: LICENSE_FIELD.EXTERNAL_API,
      isPublic: true,
    },
    [FEATURE_KEY.UPDATE_GROUP]: {
      license: LICENSE_FIELD.EXTERNAL_API,
      isPublic: true,
    },
    [FEATURE_KEY.LIST_GROUPS]: {
      license: LICENSE_FIELD.EXTERNAL_API,
      isPublic: true,
    },
    [FEATURE_KEY.GET_GROUP]: {
      license: LICENSE_FIELD.EXTERNAL_API,
      isPublic: true,
    },
    [FEATURE_KEY.DELETE_GROUP]: {
      license: LICENSE_FIELD.EXTERNAL_API,
      isPublic: true,
    },
    [FEATURE_KEY.LIST_MODULES]: {
      license: LICENSE_FIELD.EXTERNAL_API,
      isPublic: true,
    },
    [FEATURE_KEY.EXPORT_MODULE]: {
      license: LICENSE_FIELD.EXTERNAL_API,
      isPublic: true,
    },
    [FEATURE_KEY.IMPORT_MODULE]: {
      license: LICENSE_FIELD.EXTERNAL_API,
      isPublic: true,
    },
    [FEATURE_KEY.EXPORT_TJDB_TABLE_AS_CSV]: {
      license: LICENSE_FIELD.EXTERNAL_API,
      isPublic: true,
    },
    [FEATURE_KEY.BAN_USER]: {
      isPublic: true,
    },
    [FEATURE_KEY.UNBAN_USER]: {
      isPublic: true,
    },
    [FEATURE_KEY.BAN_WORKSPACE]: {
      isPublic: true,
    },
    [FEATURE_KEY.UNBAN_WORKSPACE]: {
      isPublic: true,
    },
    [FEATURE_KEY.GET_WORKSPACE_USERS_BY_GROUPS]: {
      license: LICENSE_FIELD.EXTERNAL_API,
      isPublic: true,
    },
    [FEATURE_KEY.CREATE_APP_V2]: {
      license: LICENSE_FIELD.EXTERNAL_API,
      isPublic: true,
    },
    [FEATURE_KEY.RENAME_APP_V2]: {
      license: LICENSE_FIELD.EXTERNAL_API,
      isPublic: true,
    },
    [FEATURE_KEY.LIST_APPS_V2]: {
      license: LICENSE_FIELD.EXTERNAL_API,
      isPublic: true,
    },
    [FEATURE_KEY.GET_APP_V2]: {
      license: LICENSE_FIELD.EXTERNAL_API,
      isPublic: true,
    },
    [FEATURE_KEY.DELETE_APP_V2]: {
      license: LICENSE_FIELD.EXTERNAL_API,
      isPublic: true,
    },
    [FEATURE_KEY.IMPORT_APP_V2]: {
      license: LICENSE_FIELD.EXTERNAL_API,
      isPublic: true,
    },
    [FEATURE_KEY.EXPORT_APP_V2]: {
      license: LICENSE_FIELD.EXTERNAL_API,
      isPublic: true,
    },
    [FEATURE_KEY.CREATE_MODULE_V2]: {
      license: LICENSE_FIELD.EXTERNAL_API,
      isPublic: true,
    },
    [FEATURE_KEY.RENAME_MODULE_V2]: {
      license: LICENSE_FIELD.EXTERNAL_API,
      isPublic: true,
    },
    [FEATURE_KEY.LIST_MODULES_V2]: {
      license: LICENSE_FIELD.EXTERNAL_API,
      isPublic: true,
    },
    [FEATURE_KEY.GET_MODULE_V2]: {
      license: LICENSE_FIELD.EXTERNAL_API,
      isPublic: true,
    },
    [FEATURE_KEY.DELETE_MODULE_V2]: {
      license: LICENSE_FIELD.EXTERNAL_API,
      isPublic: true,
    },
    [FEATURE_KEY.IMPORT_MODULE_V2]: {
      license: LICENSE_FIELD.EXTERNAL_API,
      isPublic: true,
    },
    [FEATURE_KEY.EXPORT_MODULE_V2]: {
      license: LICENSE_FIELD.EXTERNAL_API,
      isPublic: true,
    },
    [FEATURE_KEY.CREATE_WORKFLOW_V2]: {
      license: LICENSE_FIELD.EXTERNAL_API,
      isPublic: true,
    },
    [FEATURE_KEY.RENAME_WORKFLOW_V2]: {
      license: LICENSE_FIELD.EXTERNAL_API,
      isPublic: true,
    },
    [FEATURE_KEY.LIST_WORKFLOWS_V2]: {
      license: LICENSE_FIELD.EXTERNAL_API,
      isPublic: true,
    },
    [FEATURE_KEY.GET_WORKFLOW_V2]: {
      license: LICENSE_FIELD.EXTERNAL_API,
      isPublic: true,
    },
    [FEATURE_KEY.DELETE_WORKFLOW_V2]: {
      license: LICENSE_FIELD.EXTERNAL_API,
      isPublic: true,
    },
    [FEATURE_KEY.IMPORT_WORKFLOW_V2]: {
      license: LICENSE_FIELD.EXTERNAL_API,
      isPublic: true,
    },
    [FEATURE_KEY.EXPORT_WORKFLOW_V2]: {
      license: LICENSE_FIELD.EXTERNAL_API,
      isPublic: true,
    },
  },
};
