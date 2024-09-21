import { GroupPermissions } from 'src/entities/group_permissions.entity';
import { GROUP_PERMISSIONS_TYPE, USER_ROLE } from '../constants/group-permissions.constant';
import { SearchParamItem } from '@helpers/db-utility/db-utility.interface';

export interface CreateDefaultGroupObject {
  type: GROUP_PERMISSIONS_TYPE;
  name: string;
  appCreate: boolean;
  appDelete: boolean;
  folderCRUD: boolean;
  orgConstantCRUD: boolean;
  dataSourceCreate: boolean;
  dataSourceDelete: boolean;
}

export interface ValidateEditUserGroupAdditionObject {
  userId: string;
  groupsToAddIds: string[];
  organizationId: string;
}

export interface UpdateGroupObject {
  id: string;
  organizationId: string;
}
export interface DuplicateGroupObject {
  groupId: string;
  organizationId: string;
}

export interface GetGroupUsersObject {
  groupId: string;
  organizationId: string;
}

export interface GroupQuerySearchParamObject {
  [key: string]: SearchParamItem | boolean | string | number;
  name?: SearchParamItem;
  type?: string;
  editable?: boolean;
  onlyBuilder?: boolean;
}

export interface AddUserRoleObject {
  role: USER_ROLE;
  userId: string;
}

export interface GetUsersResponse {
  groupPermissions: GroupPermissions[];
  length: number;
}
