import { IsUUID, IsOptional } from 'class-validator';

export class ExportResourcesDto {
  @IsOptional()
  app: ExportAppDto[];

  @IsOptional()
  tooljet_database: ExportTooljetDatabaseDto[];

  @IsUUID()
  organization_id: string;
}

export class ExportAppDto {
  @IsUUID()
  id: string;

  @IsOptional()
  search_params: any;
}

export class ExportTooljetDatabaseDto {
  @IsUUID()
  table_id: string;

  // @IsOptional()
  // data: boolean;
}
