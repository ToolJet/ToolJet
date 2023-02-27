import { IsUUID, IsOptional, ValidateNested, IsString } from 'class-validator';

export class ExportResourcesDto {
  @IsOptional()
  app: ExportAppDto[];

  @IsOptional()
  tooljet_database: ExportTooljetDatabaseDto[];

  @IsUUID()
  organization_id: string
}

export class ExportAppDto {
  @IsUUID()
  id: string;

  @IsOptional()
  search_params: any;
}

export class ExportTooljetDatabaseDto {
  @IsString()
  table_name: string;

  // @IsOptional()
  // data: boolean;
}
