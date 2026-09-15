import { Transform } from 'class-transformer';
import { IsUUID, IsString, IsOptional, IsNotEmpty, IsDefined, IsIn, ValidateIf } from 'class-validator';
import { sanitizeInput } from 'src/helpers/utils.helper';
import { PartialType } from '@nestjs/mapped-types';
import { QueryResult } from '@tooljet/plugins/dist/packages/common/lib';
import { OpenApiSpecSourceType } from '@modules/openapi-spec/constants';

export class CreateDataSourceDto {
  @IsUUID()
  @IsOptional()
  plugin_id: string;

  @IsString()
  @Transform(({ value }) => sanitizeInput(value))
  @IsNotEmpty()
  kind: string;

  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => sanitizeInput(value))
  name: string;

  @IsDefined()
  options: any;

  @IsUUID()
  @IsOptional()
  environment_id: string;
}

export class UpdateDataSourceDto extends PartialType(CreateDataSourceDto) {}
export class TestDataSourceDto extends PartialType(CreateDataSourceDto) {
  @IsString()
  @IsOptional()
  @Transform(({ value }) => sanitizeInput(value))
  environment_id: string;
}

export class TestSampleDataSourceDto extends TestDataSourceDto {
  @IsString()
  dataSourceId: string;
}

export class GetDataSourceOauthUrlDto {
  @IsString()
  @IsNotEmpty()
  provider: string;

  @IsOptional()
  source_options: any;

  @IsOptional()
  plugin_id: string;

  @IsOptional()
  @IsString()
  environment_id?: string;

  @IsOptional()
  @IsUUID()
  organization_id?: string;
}

export class AuthorizeDataSourceOauthDto {
  @IsString()
  @IsNotEmpty()
  code: string;
}

export class CreateArgumentsDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  kind?: string;

  @IsOptional()
  @IsString()
  options?: Array<object>;

  @IsOptional()
  @IsString()
  pluginId?: string;

  @IsOptional()
  @IsString()
  environmentId?: string;
}

export class InvokeDataSourceMethodDto {
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => sanitizeInput(value))
  method: string;

  @IsString()
  environmentId: string;

  @IsOptional()
  args?: any;

  @IsOptional()
  resolvedOptions?: object;
}

export type InvokeDataSourceMethodResponseDto = QueryResult;

export class ValidateOptionsDto {
  @IsDefined()
  options: Record<string, any>;

  @IsDefined()
  schema: Record<string, any>;

  @IsUUID()
  @IsOptional()
  environment_id?: string;
}

export class CreateOpenApiSpecDto {
  @IsIn([OpenApiSpecSourceType.URL, OpenApiSpecSourceType.DEFINITION])
  sourceType: OpenApiSpecSourceType;

  @ValidateIf((dto) => dto.sourceType === OpenApiSpecSourceType.URL)
  @IsNotEmpty()
  @IsString()
  url?: string;

  @ValidateIf((dto) => dto.sourceType === OpenApiSpecSourceType.DEFINITION)
  @IsNotEmpty()
  @IsString()
  definition?: string;

  // Explicit environment to (re)process. Omit to process every environment the
  // organization has (fan-out behaviour depends on multi-environment licensing).
  @IsOptional()
  @IsString()
  environmentId?: string;
}

export class OpenApiSpecOperationsQueryDto {
  @IsOptional()
  @IsString()
  environmentId?: string;

  @IsOptional()
  @IsString()
  service?: string;

  @IsOptional()
  @IsString()
  tag?: string;

  @IsOptional()
  @IsString()
  search?: string;

  // 1-indexed, matching AppListDto/organization-users' pagination convention.
  @IsOptional()
  @IsString()
  page?: string;

  @IsOptional()
  @IsString()
  perPage?: string;
}
