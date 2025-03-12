import { Transform } from 'class-transformer';
import { IsUUID, IsString, IsOptional, IsNotEmpty, IsDefined } from 'class-validator';
import { sanitizeInput } from 'src/helpers/utils.helper';
import { PartialType } from '@nestjs/mapped-types';

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

  @IsString()
  @IsOptional()
  plugin_id: string;
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
