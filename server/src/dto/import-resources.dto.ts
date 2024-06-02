import { IsUUID, IsOptional, IsString, IsDefined } from 'class-validator';
import { JsonSchemaValidator } from '@dto/validators/validation';
import { Validate } from 'class-validator';
import { Transform } from 'class-transformer';
import { transformTJDB } from './transformers/resource_import';

export class ImportResourcesDto {
  @IsUUID()
  organization_id: string;

  @IsString()
  tooljet_version: string;

  @IsOptional()
  app: ImportAppDto[];

  @IsOptional()
  @Transform(transformTJDB)
  tooljet_database: ImportTooljetDatabaseDto[];

  @Validate(JsonSchemaValidator, ['resource_import', '2.43.0'])
  validate: any;
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
