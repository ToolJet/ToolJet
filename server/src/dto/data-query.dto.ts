import { Transform } from 'class-transformer';
import { IsUUID, IsString, IsOptional, IsObject, IsNotEmpty, IsArray } from 'class-validator';
import { sanitizeInput } from 'src/helpers/utils.helper';
import { PartialType } from '@nestjs/mapped-types';

export class CreateDataQueryDto {
  @IsUUID()
  @IsOptional()
  app_version_id: string;

  @IsUUID()
  @IsOptional()
  plugin_id: string;

  @IsUUID()
  @IsOptional()
  data_source_id: string;

  @IsString()
  @Transform(({ value }) => sanitizeInput(value))
  @IsNotEmpty()
  kind: string;

  @IsOptional()
  query: object;

  @IsString()
  @Transform(({ value }) => sanitizeInput(value))
  @IsNotEmpty()
  name: string;

  @IsObject()
  options: object;

  @IsObject()
  @IsOptional()
  resolvedOptions: object;
}

export class UpdateDataQueryDto extends PartialType(CreateDataQueryDto) {}

export interface IUpdatingReferencesOptions {
  id: string;
  options: object;
}

export class UpdatingReferencesOptionsDto {
  @IsUUID()
  app_version_id: string;

  @IsArray()
  data_queries_options: IUpdatingReferencesOptions[];
}
