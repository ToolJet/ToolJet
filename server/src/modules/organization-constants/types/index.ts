import { FEATURE_KEY, OrganizationConstantType } from '../constants';
import { FeatureConfig } from '@modules/app/types';
import { MODULES } from '@modules/app/constants/modules';

interface Features {
  [FEATURE_KEY.LIST]: FeatureConfig;
  [FEATURE_KEY.GET]: FeatureConfig;
  [FEATURE_KEY.BULK_DELETE]: FeatureConfig;
  [FEATURE_KEY.GET_PUBLIC]: FeatureConfig;
  [FEATURE_KEY.GET_FROM_APP]: FeatureConfig;
  [FEATURE_KEY.GET_FROM_ENVIRONMENT]: FeatureConfig;
  [FEATURE_KEY.CREATE]: FeatureConfig;
  [FEATURE_KEY.UPDATE]: FeatureConfig;
  [FEATURE_KEY.DELETE]: FeatureConfig;
  [FEATURE_KEY.GET_SECRETS]: FeatureConfig;
  [FEATURE_KEY.GET_DECRYPTED_CONSTANTS]: FeatureConfig;
}

export interface FeaturesConfig {
  [MODULES.ORGANIZATION_CONSTANT]: Features;
}

export interface ConstantEnvironmentValue {
  environmentName: string;
  value: string;
  id?: string;
}

// Response row of allEnvironmentConstants. `fromEnv` marks constants read from server environment variables.
export interface ConstantWithEnvironmentValues {
  id: string;
  name: string;
  type: OrganizationConstantType;
  createdAt: Date | string;
  values: ConstantEnvironmentValue[];
  fromEnv?: boolean;
}

export interface ConstantUserRef {
  id: string;
  name: string;
}

// Wire-shaped (snake_case) results of the v2 read methods. The controller turns them into response DTOs;
// class-transformer reads the `@Expose({ name })` keys from its plain input, so they are built in wire form.
export interface ConstantListItemPayload {
  kind: 'constant';
  id: string;
  name: string;
  type: OrganizationConstantType;
  source: 'workspace' | 'env';
  value: string | null;
  has_value: boolean;
  environments_with_value: string[];
  last_modified_at: string | null;
  owner: ConstantUserRef | null;
  modified_by: ConstantUserRef | null;
  actions: { edit: boolean; delete: boolean };
}

export interface ConstantListPayload {
  items: ConstantListItemPayload[];
  page: number;
  page_size: number;
  total: number;
  counts: { secrets: number; globals: number };
}

export interface ConstantDetailPayload {
  id: string;
  name: string;
  type: OrganizationConstantType;
  owner: ConstantUserRef | null;
  modified_by: ConstantUserRef | null;
  last_modified_at: string | null;
  created_at: string;
  values: { environment_id: string; environment_name: string; has_value: boolean; value: string | null }[];
}

export interface BulkDeleteConstantsPayload {
  deleted_ids: string[];
  skipped_ids: string[];
}
