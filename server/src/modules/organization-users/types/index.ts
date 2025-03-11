import { FEATURE_KEY } from '../constants';
import { FeatureConfig } from '@modules/app/types';
import { MODULES } from '@modules/app/constants/modules';
import { User } from '@entities/user.entity';
import { USER_ROLE } from '@modules/group-permissions/constants';

interface Features {
  [FEATURE_KEY.SUGGEST_USERS]: FeatureConfig;
  [FEATURE_KEY.USER_ARCHIVE_ALL]: FeatureConfig;
  [FEATURE_KEY.USER_ARCHIVE]: FeatureConfig;
  [FEATURE_KEY.USER_INVITE]: FeatureConfig;
  [FEATURE_KEY.VIEW_ALL_USERS]: FeatureConfig;
  [FEATURE_KEY.USER_UNARCHIVE]: FeatureConfig;
  [FEATURE_KEY.USER_UNARCHIVE_ALL]: FeatureConfig;
  [FEATURE_KEY.USER_UPDATE]: FeatureConfig;
  [FEATURE_KEY.USER_BULK_UPLOAD]: FeatureConfig;
}

export interface FeaturesConfig {
  [MODULES.ORGANIZATION_USER]: Features;
}

export type FetchUserResponse = {
  email: string;
  firstName: string;
  lastName: string;
  name: string;
  id: string;
  status: string;
  invitationToken?: string;
  accountSetupToken?: string;
  userMetadata?: any;
  userId?: string;
  role?: string;
  avatarId?: string;
  groups?: any;
  roleGroup?: any;
};

export type UserFilterOptions = { searchText?: string; status?: string };

export type InvitedUserType = Partial<User> & {
  invitedOrganizationId?: string;
  organizationStatus?: string;
  organizationUserSource?: string;
};

export type RoleUpdate = {
  role: USER_ROLE;
  addGroups: string[];
  adminId: string;
};
