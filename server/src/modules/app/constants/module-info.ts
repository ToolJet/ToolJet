import { FEATURES as USER_FEATURES } from '@modules/users/constants/features';
import { FEATURES as ROOT_FEATURES } from '../constants/features';
import { FEATURES as GROUP_PERMISSIONS_FEATURES_CE } from '@modules/group-permissions/constants/features';
import { FEATURES_EE as GROUP_PERMISSIONS_FEATURES_EE } from '@modules/group-permissions/constants/features';
import { FEATURES as APP_FEATURES } from '@modules/apps/constants/features';
import { FEATURES as METADATA_FEATURES } from '@modules/meta/constants/feature';
import { FEATURES as FOLDER_FEATURES } from '@modules/folders/constants/features';
import { FEATURES as FOLDER_APPS_FEATURES } from '@modules/folder-apps/constants/feature';
import { FEATURES as CUSTOM_STYLES_FEATURES } from '@modules/custom-styles/constants/feature';
import { FEATURES as VERSION_FEATURES } from '@modules/versions/constants/features';
import { FEATURES as SMTP_FEATURES } from '@modules/smtp/constants/features';
import { FEATURES as GLOBAL_DATA_SOURCE_FEATURES } from '@modules/data-sources/constants/feature';
import { FEATURES as PROFILE_FEATURES } from '@modules/profile/constants/feature';
import { FEATURES as FILE_FEATURES } from '@modules/files/constants/feature';
import { FEATURES as DATA_QUERY_FEATURES } from '@modules/data-queries/constants/feature';
import { FEATURES as LOGIN_CONFIGS } from '@modules/login-configs/constants/feature';
import { FEATURES as CONFIGS_FEATURES } from '@modules/configs/constants/feature';
import { FEATURES as SESSION_FEATURES } from '@modules/session/constants/feature';
import { FEATURES as ONBOARDING_FEATURES } from '@modules/onboarding/constants/feature';
import { FEATURES as AUTH_FEATURES } from '@modules/auth/constants/feature';
import { FEATURES as ORGANIZATIONS_FEATURES } from '@modules/organizations/constants/feature';
import { FEATURES as ORGANIZATION_CONSTANT } from '@modules/organization-constants/constants/feature';
import { FEATURES as ORGANIZATION_USERS_FEATURES } from '@modules/organization-users/constants/feature';
import { FEATURES as APP_ENVIRONMENTS_FEATURES } from '@modules/app-environments/constants/feature';
import { FEATURES as LICENSING_FEATURES } from '@modules/licensing/constants/features';
import { FEATURES as WORKFLOW_FEATURES } from '@modules/workflows/constants/feature';
import { FEATURES as INSTANCE_SETTINGS_FEATURES } from '@modules/instance-settings/constants/features';
import { FEATURES as ORGANIZATION_THEMES_FEATURES } from '@modules/organization-themes/constants/feature';
import { FEATURES as PLUGINS_FEATURES } from '@modules/plugins/constants/features';
import { FEATURES as TOOLJET_DATABASE_FEATURES } from '@modules/tooljet-db/constants/features';
import { FEATURES as IMPORT_EXPORT_RESOURCES_FEATURES } from '@modules/import-export-resources/constants/feature';
import { FEATURES as TEMPLATES_FEATURES } from '@modules/templates/constants/features';
import { FEATURES as AI_FEATURES } from '@modules/ai/constants/feature';
import { FEATURES as AUDIT_LOGS_FEATURES } from '@modules/audit-logs/constants/features';
import { getTooljetEdition } from '@helpers/utils.helper';
import { TOOLJET_EDITIONS } from '.';
import { FEATURES as WHITE_LABELLING_FEATURES } from '@modules/white-labelling/constant/feature';
import { FEATURES as APP_PERMISSIONS_FEATURES } from '@modules/app-permissions/constants/features';
import { FEATURES as EXTERNAL_API_FEATURES } from '@modules/external-apis/constants/feature';

const GROUP_PERMISSIONS_FEATURES =
  getTooljetEdition() === TOOLJET_EDITIONS.EE ? GROUP_PERMISSIONS_FEATURES_EE : GROUP_PERMISSIONS_FEATURES_CE;

//every module should be here
export const MODULE_INFO: { [key: string]: any } = {
  ...ROOT_FEATURES,
  ...USER_FEATURES,
  ...SESSION_FEATURES,
  ...GROUP_PERMISSIONS_FEATURES,
  ...APP_FEATURES,
  ...METADATA_FEATURES,
  ...FOLDER_FEATURES,
  ...FOLDER_APPS_FEATURES,
  ...CUSTOM_STYLES_FEATURES,
  ...VERSION_FEATURES,
  ...SMTP_FEATURES,
  ...GLOBAL_DATA_SOURCE_FEATURES,
  ...PROFILE_FEATURES,
  ...FILE_FEATURES,
  ...DATA_QUERY_FEATURES,
  ...LOGIN_CONFIGS,
  ...CONFIGS_FEATURES,
  ...ONBOARDING_FEATURES,
  ...AUTH_FEATURES,
  ...ORGANIZATIONS_FEATURES,
  ...ORGANIZATION_USERS_FEATURES,
  ...APP_ENVIRONMENTS_FEATURES,
  ...LICENSING_FEATURES,
  ...WORKFLOW_FEATURES,
  ...INSTANCE_SETTINGS_FEATURES,
  ...ORGANIZATION_THEMES_FEATURES,
  ...PLUGINS_FEATURES,
  ...TOOLJET_DATABASE_FEATURES,
  ...IMPORT_EXPORT_RESOURCES_FEATURES,
  ...TEMPLATES_FEATURES,
  ...ORGANIZATION_CONSTANT,
  ...AI_FEATURES,
  ...WHITE_LABELLING_FEATURES,
  ...APP_PERMISSIONS_FEATURES,
  ...AUDIT_LOGS_FEATURES,
  ...EXTERNAL_API_FEATURES,
};
