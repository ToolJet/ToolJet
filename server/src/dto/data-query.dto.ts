import { Transform } from 'class-transformer';
import { IsUUID, IsString, IsOptional, IsObject, IsNotEmpty } from 'class-validator';
import { sanitizeInput } from 'src/helpers/utils.helper';
import { PartialType } from '@nestjs/mapped-types';

export class CreateDataQueryDto {
  @IsUUID()
  app_id: string;

  @IsUUID()
  app_version_id: string;

  @IsUUID()
  @IsOptional()
  plugin_id: string;

  @IsUUID()
  @IsOptional()
  data_source_id: string;

  @IsUUID()
  @IsOptional()
  organizationId: string;

  @IsString()
  @Transform(({ value }) => sanitizeInput(value))
  @IsNotEmpty()
  kind: string;

  @IsObject()
  @IsOptional()
  query: object;

  @IsString()
  @Transform(({ value }) => sanitizeInput(value))
  @IsNotEmpty()
  name: string;

  @IsObject()
  options: object;
}

export class UpdateDataQueryDto extends PartialType(CreateDataQueryDto) {}
