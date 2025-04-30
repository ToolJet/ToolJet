import { GroupPermissions } from '@entities/group_permissions.entity';
import { FEATURE_KEY, GROUP_PERMISSIONS_TYPE, USER_ROLE } from '../constants';
import { FeatureConfig } from '@modules/app/types';
import { MODULES } from '@modules/app/constants/modules';

export interface CreateDefaultGroupObject {
  type?: GROUP_PERMISSIONS_TYPE;
  name: string;
  appCreate?: boolean;
  appDelete?: boolean;
  folderCRUD?: boolean;
  orgConstantCRUD?: boolean;
  dataSourceCreate?: boolean;
  dataSourceDelete?: boolean;
}

export interface GranularPermissionQuerySearchParam {
  [key: string]: SearchParamItem | boolean | string | number;
  name?: SearchParamItem;
  type?: string;
  groupId?: string;
  filterDataSource?: boolean;
}
interface SearchParamItem {
  value: string;
  useLike: boolean;
}

export interface GetUsersResponse {
  groupPermissions: GroupPermissions[];
  length: number;
}

export interface UpdateGroupObject {
  id: string;
  organizationId: string;
}

export interface AddUserRoleObject {
  role: USER_ROLE;
  userId: string;
}

interface Features {
  [FEATURE_KEY.ADD_GROUP_USER]: FeatureConfig;
  [FEATURE_KEY.CREATE]: FeatureConfig;
  [FEATURE_KEY.DELETE]: FeatureConfig;
  [FEATURE_KEY.DELETE_GROUP_USER]: FeatureConfig;
  [FEATURE_KEY.DUPLICATE]: FeatureConfig;
  [FEATURE_KEY.GET_ADDABLE_USERS]: FeatureConfig;
  [FEATURE_KEY.GET_ONE]: FeatureConfig;
  [FEATURE_KEY.GET_ALL]: FeatureConfig;
  [FEATURE_KEY.UPDATE]: FeatureConfig;
  [FEATURE_KEY.GET_ALL_GROUP_USER]: FeatureConfig;
  [FEATURE_KEY.DELETE_GRANULAR_PERMISSIONS]: FeatureConfig;
  [FEATURE_KEY.CREATE_GRANULAR_PERMISSIONS]: FeatureConfig;
  [FEATURE_KEY.GET_ALL_GRANULAR_PERMISSIONS]: FeatureConfig;
  [FEATURE_KEY.GET_ADDABLE_APPS]: FeatureConfig;
  [FEATURE_KEY.UPDATE_GRANULAR_PERMISSIONS]: FeatureConfig;
  [FEATURE_KEY.GET_ADDABLE_DS]: FeatureConfig;
  [FEATURE_KEY.USER_ROLE_CHANGE]: FeatureConfig;
}

export interface FeaturesConfig {
  [MODULES.GROUP_PERMISSIONS]: Features;
}
