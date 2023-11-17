import { Transform } from 'class-transformer';
import { IsUUID, IsString, IsOptional, IsNotEmpty, IsDefined } from 'class-validator';
import { sanitizeInput } from 'src/helpers/utils.helper';
import { PartialType } from '@nestjs/mapped-types';

export class CreateDataSourceDto {
  @IsUUID()
  @IsOptional()
  app_version_id: string;

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

  @IsOptional()
  scope: string;

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

export class GetDataSourceOauthUrlDto {
  @IsString()
  @IsNotEmpty()
  provider: string;
}

export class AuthorizeDataSourceOauthDto {
  @IsString()
  @IsNotEmpty()
  code: string;
}
