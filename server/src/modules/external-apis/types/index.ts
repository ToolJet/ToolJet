import { MODULES } from '@modules/app/constants/modules';
import { FEATURE_KEY } from '../constants';
import { FeatureConfig } from '@modules/app/types';

interface Features {
  [FEATURE_KEY.GET_ALL_USERS]: FeatureConfig;
  [FEATURE_KEY.GET_USER]: FeatureConfig;
  [FEATURE_KEY.CREATE_USER]: FeatureConfig;
  [FEATURE_KEY.UPDATE_USER]: FeatureConfig;
  [FEATURE_KEY.REPLACE_USER_WORKSPACES]: FeatureConfig;
  [FEATURE_KEY.UPDATE_USER_WORKSPACE]: FeatureConfig;
  [FEATURE_KEY.GET_ALL_WORKSPACES]: FeatureConfig;
  [FEATURE_KEY.PULL_NEW_APP]: FeatureConfig;
  [FEATURE_KEY.PULL_EXISTING_APP]: FeatureConfig;
  [FEATURE_KEY.PUSH_APP_VERSION]: FeatureConfig;
  [FEATURE_KEY.UPDATE_USER_ROLE]: FeatureConfig;
  [FEATURE_KEY.UPDATE_USER_METADATA]: FeatureConfig;
  [FEATURE_KEY.GET_USER_METADATA]: FeatureConfig;
  [FEATURE_KEY.CREATE_ORG_GIT]: FeatureConfig;
  [FEATURE_KEY.AUTO_RELEASE_APP]: FeatureConfig;
  [FEATURE_KEY.SAVE_APP_VERSION]: FeatureConfig;
  [FEATURE_KEY.GET_ALL_WORKSPACE_APPS]: FeatureConfig;
  [FEATURE_KEY.IMPORT_APP]: FeatureConfig;
  [FEATURE_KEY.EXPORT_APP]: FeatureConfig;
  [FEATURE_KEY.GENERATE_PAT]: FeatureConfig;
  [FEATURE_KEY.VALIDATE_PAT_SESSION]: FeatureConfig;
  [FEATURE_KEY.CREATE_GROUP]: FeatureConfig;
  [FEATURE_KEY.UPDATE_GROUP]: FeatureConfig;
  [FEATURE_KEY.LIST_GROUPS]: FeatureConfig;
  [FEATURE_KEY.GET_GROUP]: FeatureConfig;
  [FEATURE_KEY.DELETE_GROUP]: FeatureConfig;
  [FEATURE_KEY.LIST_MODULES]: FeatureConfig;
  [FEATURE_KEY.EXPORT_MODULE]: FeatureConfig;
  [FEATURE_KEY.IMPORT_MODULE]: FeatureConfig;
  [FEATURE_KEY.EXPORT_TJDB_TABLE_AS_CSV]: FeatureConfig;
  [FEATURE_KEY.UPDATE_USER_METADATA]: FeatureConfig;
  [FEATURE_KEY.GET_USER_METADATA]: FeatureConfig;
  [FEATURE_KEY.BAN_USER]: FeatureConfig;
  [FEATURE_KEY.UNBAN_USER]: FeatureConfig;
  [FEATURE_KEY.BAN_WORKSPACE]: FeatureConfig;
  [FEATURE_KEY.UNBAN_WORKSPACE]: FeatureConfig;
  [FEATURE_KEY.GET_WORKSPACE_USERS_BY_GROUPS]: FeatureConfig;
  [FEATURE_KEY.CREATE_APP_V2]: FeatureConfig;
  [FEATURE_KEY.RENAME_APP_V2]: FeatureConfig;
  [FEATURE_KEY.LIST_APPS_V2]: FeatureConfig;
  [FEATURE_KEY.GET_APP_V2]: FeatureConfig;
  [FEATURE_KEY.DELETE_APP_V2]: FeatureConfig;
  [FEATURE_KEY.IMPORT_APP_V2]: FeatureConfig;
  [FEATURE_KEY.EXPORT_APP_V2]: FeatureConfig;
  [FEATURE_KEY.CREATE_MODULE_V2]: FeatureConfig;
  [FEATURE_KEY.RENAME_MODULE_V2]: FeatureConfig;
  [FEATURE_KEY.LIST_MODULES_V2]: FeatureConfig;
  [FEATURE_KEY.GET_MODULE_V2]: FeatureConfig;
  [FEATURE_KEY.DELETE_MODULE_V2]: FeatureConfig;
  [FEATURE_KEY.IMPORT_MODULE_V2]: FeatureConfig;
  [FEATURE_KEY.EXPORT_MODULE_V2]: FeatureConfig;
  [FEATURE_KEY.CREATE_WORKFLOW_V2]: FeatureConfig;
  [FEATURE_KEY.RENAME_WORKFLOW_V2]: FeatureConfig;
  [FEATURE_KEY.LIST_WORKFLOWS_V2]: FeatureConfig;
  [FEATURE_KEY.GET_WORKFLOW_V2]: FeatureConfig;
  [FEATURE_KEY.DELETE_WORKFLOW_V2]: FeatureConfig;
  [FEATURE_KEY.IMPORT_WORKFLOW_V2]: FeatureConfig;
  [FEATURE_KEY.EXPORT_WORKFLOW_V2]: FeatureConfig;
  [FEATURE_KEY.CREATE_APP_FOLDER_V2]: FeatureConfig;
  [FEATURE_KEY.LIST_APP_FOLDERS_V2]: FeatureConfig;
  [FEATURE_KEY.GET_APP_FOLDER_V2]: FeatureConfig;
  [FEATURE_KEY.UPDATE_APP_FOLDER_V2]: FeatureConfig;
  [FEATURE_KEY.DELETE_APP_FOLDER_V2]: FeatureConfig;
  [FEATURE_KEY.CREATE_MODULE_FOLDER_V2]: FeatureConfig;
  [FEATURE_KEY.LIST_MODULE_FOLDERS_V2]: FeatureConfig;
  [FEATURE_KEY.GET_MODULE_FOLDER_V2]: FeatureConfig;
  [FEATURE_KEY.UPDATE_MODULE_FOLDER_V2]: FeatureConfig;
  [FEATURE_KEY.DELETE_MODULE_FOLDER_V2]: FeatureConfig;
  [FEATURE_KEY.CREATE_WORKFLOW_FOLDER_V2]: FeatureConfig;
  [FEATURE_KEY.LIST_WORKFLOW_FOLDERS_V2]: FeatureConfig;
  [FEATURE_KEY.GET_WORKFLOW_FOLDER_V2]: FeatureConfig;
  [FEATURE_KEY.UPDATE_WORKFLOW_FOLDER_V2]: FeatureConfig;
  [FEATURE_KEY.DELETE_WORKFLOW_FOLDER_V2]: FeatureConfig;
}

export interface FeaturesConfig {
  [MODULES.EXTERNAL_APIS]: Features;
}

export interface ValidateEditUserGroupAdditionObject {
  userId: string;
  groupsToAddIds: string[];
  organizationId: string;
}

export interface AppResourceMappings {
  defaultDataSourceIdMapping: Record<string, string>;
  dataQueryMapping: Record<string, string>;
  appVersionMapping: Record<string, string>;
  appEnvironmentMapping: Record<string, string>;
  appDefaultEnvironmentMapping: Record<string, string[]>;
  pagesMapping: Record<string, string>;
  componentsMapping: Record<string, string>;
}
