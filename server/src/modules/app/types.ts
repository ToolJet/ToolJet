import { LICENSE_FIELD } from '@modules/licensing/constants';
import { MODULES } from './constants/modules';
import { UserPermissions } from '@modules/ability/types';
import { User } from '@entities/user.entity';
import { FEATURE_KEY } from './constants';

export interface UserAllPermissions {
  userPermission: UserPermissions;
  superAdmin: boolean;
  isAdmin: boolean;
  isBuilder: boolean;
  isEndUser: boolean;
  user: User;
  resource: ResourceDetails[];
}

export interface FeatureConfig {
  license?: LICENSE_FIELD;
  auditLogsKey?: string;
  skipAuditLogs?: boolean;
  isPublic?: boolean;
  isSuperAdminFeature?: boolean;
  shouldNotSkipPublicApp?: boolean;
}

export interface ResourceDetails {
  resourceType: MODULES;
  resourceId?: string;
}

interface Features {
  [FEATURE_KEY.HEALTH]: FeatureConfig;
  [FEATURE_KEY.ROOT]: FeatureConfig;
}

export interface FeaturesConfig {
  [MODULES.ROOT]: Features;
}
