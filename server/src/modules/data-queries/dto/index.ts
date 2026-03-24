import { Transform } from 'class-transformer';
import { IsUUID, IsString, IsOptional, IsObject, IsNotEmpty, IsArray,IsNumber } from 'class-validator';
import { sanitizeInput } from 'src/helpers/utils.helper';
import { PartialType } from '@nestjs/mapped-types';

export class CreateDataQueryDto {
  @IsUUID()
  @IsOptional()
  app_version_id: string;

  @IsString()
  @Transform(({ value }) => sanitizeInput(value))
  @IsNotEmpty()
  kind: string;

  @IsString()
  @Transform(({ value }) => sanitizeInput(value))
  @IsNotEmpty()
  @IsOptional()
  type: string;

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

export class UpdateSourceDto {
  @IsNotEmpty()
  @IsUUID()
  data_source_id: string;
}

export class ListTablesDto {
  @IsString()
  @IsOptional()
  schema?: string;

  @IsString()
  @IsOptional()
  search?: string;

  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  @IsOptional()
  page?: number;

  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  @IsOptional()
  limit?: number;
}