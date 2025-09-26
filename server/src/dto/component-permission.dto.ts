import { PAGE_PERMISSION_TYPE } from '@modules/app-permissions/constants';
import { GROUP_PERMISSIONS_TYPE, USER_ROLE } from '@modules/group-permissions/constants';
import { OnboardingStatus } from '@modules/onboarding/constants';

export interface UserData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  status: string;
  source: string;
  onboardingStatus: OnboardingStatus;
  userType: string;
  avatarId?: string;
  invitationToken: string;
  forgotPasswordToken: string;
  password: string;
  defaultOrganizationId: string;
  companyName: string;
  role: string;
  companySize: string;
  autoActivated: boolean;
  passwordRetryCount: number;
  createdAt: Date;
  updatedAt: Date;
  organizationId: string;
  invitedOrganizationId: string;
  organizationIds?: Array<string>;
  isPasswordLogin: boolean;
  isSSOLogin: boolean;
  sessionId: string;
  roleGroup: USER_ROLE;
}

// 2. GroupPermissions DTO
export interface GroupPermissionsData {
  id: string;
  organizationId: string;
  name: string;
  type: GROUP_PERMISSIONS_TYPE;
  appCreate: boolean;
  appDelete: boolean;
  workflowCreate: boolean;
  workflowDelete: boolean;
  folderCRUD: boolean;
  orgConstantCRUD: boolean;
  dataSourceCreate: boolean;
  dataSourceDelete: boolean;
  appPromote: boolean;
  appRelease: boolean;
  createdAt: Date;
  updatedAt: Date;
  disabled?: boolean;
}

export interface ComponentUserData {
  id: string;
  componentPermissionsId: string;
  userId: string | null;
  permissionGroupsId: string | null;
  createdAt: Date;
  user: UserData;
  permissionGroup?: GroupPermissionsData;
}
export interface ComponentPermissionData {
  id: string;
  componentId: string;
  type: PAGE_PERMISSION_TYPE;
  createdAt: Date;
  users: ComponentUserData[];
}
