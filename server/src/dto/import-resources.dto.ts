import { IsUUID, IsOptional, IsString, IsDefined, ValidateNested } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ValidateTooljetDatabaseSchema } from './validators/tooljet-database.validator';
import { TjdbSchemaToLatestVersion } from './transformers/resource-transformer';

export class ImportResourcesDto {
  @IsUUID()
  organization_id: string;

  @IsString()
  tooljet_version: string;

  // TODO: Add transformation and validation for app similar to tooljet_database
  @IsOptional()
  app: ImportAppDto[];

  @IsOptional()
  // Transform the input data to the latest schema version
  // This should be applied first to ensure the data is in
  // the correct format before validation
  @Transform(TjdbSchemaToLatestVersion)
  @ValidateNested({ each: true })
  // Ensure each item is properly instantiated as ImportTooljetDatabaseDto
  // This is crucial for nested validation to work correctly
  @Type(() => ImportTooljetDatabaseDto)
  // Custom validator to check against the tooljet database schema
  // This should be applied last to validate the transformed
  // and instantiated data
  @ValidateTooljetDatabaseSchema({ each: true })
  tooljet_database: ImportTooljetDatabaseDto[];
}

export class ImportAppDto {
  @IsDefined()
  definition: any;

  @IsString()
  appName: string;
}

export class ImportTooljetDatabaseDto {
  @IsUUID()
  id: string;

  @IsString()
  table_name: string;

  @IsDefined()
  schema: any;

  // @IsOptional()
  // data: boolean;
}
