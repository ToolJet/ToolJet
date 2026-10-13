import { Transform, Type } from 'class-transformer';
import {
  IsUUID,
  IsString,
  IsOptional,
  IsNotEmpty,
  IsDefined,
  IsInt,
  Matches,
  IsIn,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';
import { sanitizeInput } from 'src/helpers/utils.helper';
import { PartialType } from '@nestjs/mapped-types';
import { QueryResult } from '@tooljet/plugins/dist/packages/common/lib';
import { OpenApiSpecSourceType, OpenApiSpecStatus } from '@modules/openapi-spec/constants';

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
  @Matches(/^[^/\\]*$/, { message: "Name should not contain '/' or '\\'" })
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

  // Omit to process every environment in the organization.
  @IsOptional()
  @IsUUID()
  environmentId?: string;
}

export class OpenApiSpecOperationsQueryDto {
  @IsOptional()
  @IsUUID()
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

  // 1-indexed. Bounded to keep OFFSET pagination cheap.
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100000)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1000)
  perPage?: number;
}

export interface OpenApiSpecStatusResponse {
  status: OpenApiSpecStatus | null;
  error: string | null;
}

// Mirrors extractMetadata()'s output (openapi-spec.processor.ts) - info/securitySchemes are
// already the spec's own declared JSON, not entity data, so left loosely typed on purpose.
export interface OpenApiSpecMetadataResponse {
  info: Record<string, any>;
  servers: string[];
  tags: string[];
  services: string[];
  securitySchemes: Record<string, any>;
  security: Record<string, any>[];
}

// Shared by the list endpoint and the single-operation endpoint - never dataSourceId,
// dataSourceVersionId, environmentId, createdAt or updatedAt. The query that builds this (see
// listOpenApiSpecOperations/getOpenApiSpecOperation) narrows the selected columns accordingly;
// this type documents that shape, it doesn't enforce it.
export interface OpenApiSpecOperationSummaryResponse {
  id: string;
  operationId: string;
  serviceId: string;
  path: string;
  method: string;
  name: string;
  deprecated: boolean;
  tags: string[];
  security: string[];
  hasRequestBody: boolean;
}

export interface OpenApiSpecOperationResponse extends OpenApiSpecOperationSummaryResponse {
  parameters: Record<string, any>[];
  requestBodySchema: Record<string, any> | null;
}

export interface OpenApiSpecOperationsListResponse {
  meta: {
    totalPages: number;
    totalCount: number;
    currentPage: number;
  };
  operations: OpenApiSpecOperationSummaryResponse[];
}
