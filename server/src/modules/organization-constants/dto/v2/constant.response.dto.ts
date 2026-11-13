import { Exclude, Expose, Type } from 'class-transformer';
import { OrganizationConstantType } from '../../constants';

@Exclude()
export class ConstantUserRefDto {
  @Expose()
  id: string;

  @Expose()
  name: string;
}

@Exclude()
export class ConstantListItemActionsDto {
  @Expose()
  edit: boolean;

  @Expose()
  delete: boolean;
}

@Exclude()
export class ConstantListItemDto {
  @Expose()
  kind: 'constant';

  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  type: OrganizationConstantType;

  @Expose()
  source: 'workspace' | 'env';

  // Plaintext for a Global in the selected environment; always null for a Secret.
  @Expose()
  value: string | null;

  // False when the constant has no value in the selected environment; `value` is then null.
  @Expose({ name: 'has_value' })
  hasValue: boolean;

  @Expose({ name: 'environments_with_value' })
  environmentsWithValue: string[];

  @Expose({ name: 'last_modified_at' })
  lastModifiedAt: string | null;

  @Expose()
  @Type(() => ConstantUserRefDto)
  owner: ConstantUserRefDto | null;

  @Expose({ name: 'modified_by' })
  @Type(() => ConstantUserRefDto)
  modifiedBy: ConstantUserRefDto | null;

  @Expose()
  @Type(() => ConstantListItemActionsDto)
  actions: ConstantListItemActionsDto;
}

@Exclude()
export class ConstantCountsDto {
  @Expose()
  secrets: number;

  @Expose()
  globals: number;
}

@Exclude()
export class ConstantListResponseDto {
  @Expose()
  @Type(() => ConstantListItemDto)
  items: ConstantListItemDto[];

  @Expose()
  page: number;

  @Expose({ name: 'page_size' })
  pageSize: number;

  @Expose()
  total: number;

  @Expose()
  @Type(() => ConstantCountsDto)
  counts: ConstantCountsDto;
}

@Exclude()
export class ConstantEnvironmentValueDto {
  @Expose({ name: 'environment_id' })
  environmentId: string;

  @Expose({ name: 'environment_name' })
  environmentName: string;

  @Expose({ name: 'has_value' })
  hasValue: boolean;

  // Plaintext for a Global; always null for a Secret, where only has_value says whether one is set.
  @Expose()
  value: string | null;
}

@Exclude()
export class ConstantDetailResponseDto {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  type: OrganizationConstantType;

  @Expose()
  @Type(() => ConstantUserRefDto)
  owner: ConstantUserRefDto | null;

  @Expose({ name: 'modified_by' })
  @Type(() => ConstantUserRefDto)
  modifiedBy: ConstantUserRefDto | null;

  @Expose({ name: 'last_modified_at' })
  lastModifiedAt: string | null;

  @Expose({ name: 'created_at' })
  createdAt: string;

  @Expose()
  @Type(() => ConstantEnvironmentValueDto)
  values: ConstantEnvironmentValueDto[];
}

@Exclude()
export class BulkDeleteConstantsResponseDto {
  @Expose({ name: 'deleted_ids' })
  deletedIds: string[];

  // Ids that were not deleted: read-only `.env` rows, malformed ids, and ids not found in the workspace.
  @Expose({ name: 'skipped_ids' })
  skippedIds: string[];
}
