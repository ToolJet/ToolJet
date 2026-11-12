import { Exclude, Expose, plainToInstance, Transform, Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Organization } from '@entities/organization.entity';
import { WORKSPACE_STATUS } from '@modules/users/constants/lifecycle';
import { PaginationV2ResponseDto } from '@modules/external-apis/dto';
import { WorkspaceNameField, WorkspaceSlugField } from '.';

export class CreateWorkspaceV2Dto {
  @WorkspaceNameField()
  name: string;

  @WorkspaceSlugField()
  slug: string;
}

export class UpdateWorkspaceV2Dto {
  @IsOptional()
  @WorkspaceNameField()
  name?: string;

  @IsOptional()
  @WorkspaceSlugField()
  slug?: string;

  @IsOptional()
  @IsEnum(WORKSPACE_STATUS)
  status?: WORKSPACE_STATUS;

  // true only; false is 422, move the default by setting it on another workspace
  @IsOptional()
  @IsBoolean()
  default?: boolean;
}

export class ListWorkspacesV2QueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(WORKSPACE_STATUS)
  status?: WORKSPACE_STATUS;

  @IsOptional()
  @Transform(({ value }) => (value === 'true' ? true : value === 'false' ? false : value))
  @IsBoolean()
  default?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  per_page?: number = 20;
}

@Exclude()
export class WorkspaceV2ResponseDto {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  slug: string;

  @Expose()
  status: string;

  @Expose()
  default: boolean;
}

@Exclude()
export class ListWorkspacesV2ResponseDto {
  @Expose()
  @Type(() => WorkspaceV2ResponseDto)
  data: WorkspaceV2ResponseDto[];

  @Expose()
  @Type(() => PaginationV2ResponseDto)
  pagination: PaginationV2ResponseDto;
}

export const toWorkspaceV2Response = (organization: Organization): WorkspaceV2ResponseDto =>
  plainToInstance(WorkspaceV2ResponseDto, {
    id: organization.id,
    name: organization.name,
    slug: organization.slug,
    status: organization.status,
    default: organization.isDefault,
  });
