import { Type } from 'class-transformer';
import { IsUUID, IsOptional, IsString, IsDefined, ValidateNested } from 'class-validator';
import { JsonSchemaValidator } from 'src/validators/validation';
import { Validate } from 'class-validator';

export class ImportResourcesDto {
  @Validate(JsonSchemaValidator, ['app_import', '2.43.0'])
  @IsUUID()
  organization_id: string;

  @IsString()
  tooljet_version: string;

  @IsOptional()
  app: ImportAppDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => ImportTooljetDatabaseDto)
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
