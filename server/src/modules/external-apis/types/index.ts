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
  [FEATURE_KEY.UPDATE_USER_ROLE]: FeatureConfig;
  [FEATURE_KEY.GET_ALL_WORKSPACE_APPS]: FeatureConfig;
  [FEATURE_KEY.IMPORT_APP]: FeatureConfig;
  [FEATURE_KEY.EXPORT_APP]: FeatureConfig;
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
