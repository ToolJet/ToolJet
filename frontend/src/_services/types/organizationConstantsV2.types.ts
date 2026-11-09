// Mirrors the wire-shaped payloads of the v2 organization-constants API (server ConstantListPayload,
// ConstantDetailPayload, BulkDeleteConstantsPayload) and its request DTOs.

export type ConstantType = 'Global' | 'Secret';
export type ConstantSource = 'workspace' | 'env';
export type ConstantSort = 'name_asc' | 'name_desc' | 'modified_desc' | 'modified_asc';

export interface ConstantUserRef {
  id: string;
  name: string;
}

export interface ConstantListItem {
  kind: 'constant';
  id: string;
  name: string;
  type: ConstantType;
  source: ConstantSource;
  /** Plain value of a Global in the viewed environment. Null for a Secret. */
  value: string | null;
  environments_with_value: string[];
  last_modified_at: string | null;
  owner: ConstantUserRef | null;
  modified_by: ConstantUserRef | null;
  actions: { edit: boolean; delete: boolean };
}

export interface ConstantsListResponse {
  items: ConstantListItem[];
  page: number;
  page_size: number;
  total: number;
  counts: { secrets: number; globals: number };
}

/** A list response without its items. */
export type ConstantsListMeta = Omit<ConstantsListResponse, 'items'>;

export interface ConstantEnvironmentValue {
  environment_id: string;
  environment_name: string;
  has_value: boolean;
  /** Null for a Secret, whose stored value is never returned. */
  value: string | null;
}

export interface ConstantDetail {
  id: string;
  name: string;
  type: ConstantType;
  owner: ConstantUserRef | null;
  modified_by: ConstantUserRef | null;
  last_modified_at: string | null;
  created_at: string;
  values: ConstantEnvironmentValue[];
}

/** A `null` value removes the constant's value in that environment. */
export interface ConstantValueChange {
  environment_id: string;
  value: string | null;
}

export interface CreateConstantBody {
  name: string;
  type: ConstantType;
  values: ConstantValueChange[];
}

export interface UpdateConstantBody {
  values: ConstantValueChange[];
}

export interface BulkDeleteConstantsResult {
  deleted_ids: string[];
  skipped_ids: string[];
}

export interface ListConstantsParams {
  environmentId: string;
  type: ConstantType;
  search?: string;
  source?: ConstantSource[];
  sort?: ConstantSort;
  page?: number;
  perPage?: number;
}
