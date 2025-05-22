import { MODULES } from '@modules/app/constants/modules';
import { FEATURE_KEY } from '../constants';
import { FeatureConfig } from '@modules/app/types';

export interface AuditLogsQuery {
  resources: string;
  actions: string;
  timeFrom: string;
  timeTo: string;
  users: string;
  apps: string;
  page: string;
  perPage: string;
}

export interface AuditLogFields {
  userId: string;
  organizationId: string;
  resourceId: string;
  resourceType: MODULES;
  resourceData?: object;
  actionType: string;
  resourceName?: string;
  ipAddress?: string;
  metadata?: object;
  organizationIds?: Array<string>;
}

export interface Features {
  [FEATURE_KEY.VIEW_LOGS]: FeatureConfig;
}

export interface FeaturesConfig {
  [MODULES.AUDIT_LOGS]: Features;
}
